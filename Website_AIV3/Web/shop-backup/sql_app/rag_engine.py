import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session
from .models import Product

# ==============================
# LOAD ENV
# ==============================

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ==============================
# CONFIG
# ==============================

VECTOR_DB_PATH = "faiss_products"
POLICY_VECTOR_PATH = "faiss_policy"
WEBSITE_INFO_PATH = "website_info.txt"

embeddings = HuggingFaceEmbeddings(
    model_name="keepitreal/vietnamese-sbert"
)

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=OPENAI_API_KEY
)

# ==============================
# BUILD PRODUCT VECTOR
# ==============================

def build_vector_db(db: Session):

    # 🔥 LẤY TẤT CẢ SẢN PHẨM (KỂ CẢ HẾT HÀNG ĐỂ AI BIẾT MÀ TRẢ LỜI)
    products = db.query(Product).all()

    if not products:
        return False

    texts = []

    for p in products:
        status = "Còn hàng" if p.stock > 0 else "Hết hàng (Tạm thời)"
        # 🔥 Định dạng Markdown sẵn để AI dễ dàng xử lý và hiển thị đẹp hơn ở frontend
        product_text = f"""
ID: {p.id}
**{p.name}**
Thương hiệu: {p.brand}
**Giá:** {p.price:,.0f} VND
**Giới tính:** {p.gender}
**Nồng độ:** {p.concentration or 'Chưa rõ'}
**Độ lưu hương:** {p.longevity or 'Chưa rõ'}
**Xuất xứ:** {p.origin or 'Chưa rõ'}
**Tình trạng kho:** {status}
**Mô tả:** {p.description}
![]({p.image_url})
---------------------
"""
        texts.append(product_text)

    vectorstore = FAISS.from_texts(texts, embeddings)
    vectorstore.save_local(VECTOR_DB_PATH)

    return True


# ==============================
# BUILD POLICY + FAQ VECTOR
# ==============================

def build_policy_vector():

    # 🔥 ĐỌC TỪ FILE WEBSITE_INFO.TXT CHỨA TOÀN BỘ INFO SHOP
    if not os.path.exists(WEBSITE_INFO_PATH):
        return False

    with open(WEBSITE_INFO_PATH, "r", encoding="utf-8") as f:
        full_text = f.read()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )

    chunks = splitter.split_text(full_text)

    vectorstore = FAISS.from_texts(chunks, embeddings)
    vectorstore.save_local(POLICY_VECTOR_PATH)

    return True


# ==============================
# CHAT FUNCTION
# ==============================

def get_chat_response(query: str):

    # 🔥 TÌM KIẾM TRÊN CẢ 2 VECTOR (SẢN PHẨM + CHÍNH SÁCH)
    # Để AI có thể trả lời câu hỏi phức tạp: "Chai Chanel này giá bao nhiêu và ship về HCM mất bao lâu?"
    
    docs = []
    
    # 1. Tìm trong Product DB
    try:
        product_db = FAISS.load_local(VECTOR_DB_PATH, embeddings, allow_dangerous_deserialization=True)
        product_docs = product_db.similarity_search(query, k=4) # Lấy 4 sản phẩm liên quan nhất
        docs.extend(product_docs)
    except Exception:
        pass # Bỏ qua nếu chưa có DB sản phẩm

    # 2. Tìm trong Policy DB
    try:
        policy_db = FAISS.load_local(POLICY_VECTOR_PATH, embeddings, allow_dangerous_deserialization=True)
        policy_docs = policy_db.similarity_search(query, k=2) # Lấy 2 đoạn chính sách liên quan nhất
        docs.extend(policy_docs)
    except Exception:
        pass

    if not docs:
        return "Xin lỗi, hiện tại hệ thống chưa có dữ liệu để trả lời câu hỏi này của bạn."

    context = "\n".join([doc.page_content for doc in docs])

    # ==============================
    # PROMPT NÂNG CẤP
    # ==============================

    prompt_template = """
Bạn là Trợ lý AI chuyên nghiệp của X2TN Perfume.
Nhiệm vụ của bạn là tư vấn bán hàng và giải đáp thắc mắc dựa trên dữ liệu được cung cấp.

QUY TẮC BẮT BUỘC (TUÂN THỦ NGHIÊM NGẶT):
1. CHỈ sử dụng thông tin trong phần "DỮ LIỆU HỖ TRỢ" bên dưới. KHÔNG được bịa đặt thông tin bên ngoài.
2. Nếu khách hỏi về một sản phẩm KHÔNG có trong dữ liệu -> Phải trả lời: "Dạ hiện tại shop chưa kinh doanh sản phẩm này ạ." (Tuyệt đối không bịa ra sản phẩm).
3. Nếu sản phẩm có trong dữ liệu nhưng ghi "Tình trạng kho: Hết hàng" -> Phải thông báo cho khách là đang tạm hết.
4. Khi gợi ý sản phẩm, hãy ưu tiên các sản phẩm phù hợp nhất với mô tả của khách.
5. Nếu bạn gợi ý TỪ 2 SẢN PHẨM TRỞ LÊN: Hãy chèn chuỗi ký tự "|SPLIT|" vào giữa nội dung của các sản phẩm đó. (Ví dụ: Nội dung SP A... |SPLIT| Nội dung SP B...).
6. Giọng điệu: Thân thiện, chuyên nghiệp, lễ phép.
7. Nếu khách hỏi về chính sách (ship, đổi trả...), hãy trả lời chính xác theo dữ liệu.
8. **ĐỊNH DẠNG TRẢ LỜI (QUAN TRỌNG)**:
   - **LUÔN LUÔN** xuống dòng cho mỗi ý, mỗi thuộc tính sản phẩm. KHÔNG được viết một đoạn văn dài.
   - Khi trả lời về sản phẩm, hãy giữ nguyên định dạng Markdown có sẵn trong dữ liệu (ví dụ: `**Tên sản phẩm**`, `**Giá:**`, `**Mô tả:**`, `!`).
   - Với các câu trả lời chung (không phải sản phẩm), hãy dùng gạch đầu dòng (-) để liệt kê các ý cho dễ đọc.

DỮ LIỆU HỖ TRỢ:
{context}

CÂU HỎI CỦA KHÁCH:
{query}

TRẢ LỜI:
"""

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "query"]
    )

    chain = prompt | llm

    response = chain.invoke({
        "context": context,
        "query": query
    })

    return response.content