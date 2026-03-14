"""
Trade Sovereign - FastAPI Backend Server
Full-featured trading platform with Firebase Auth, Razorpay, and Gemini AI
"""
import os
import hashlib
import hmac
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import razorpay
import resend

load_dotenv()

# ===== Logging Setup =====
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== Resend Email Setup =====
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# ===== Firebase Admin Setup =====
firebase_cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
    "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
    "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
})

if not firebase_admin._apps:
    firebase_admin.initialize_app(firebase_cred)

# ===== Razorpay Client =====
razorpay_client = razorpay.Client(
    auth=(os.environ.get("RAZORPAY_KEY_ID"), os.environ.get("RAZORPAY_KEY_SECRET"))
)

# ===== MongoDB Setup =====
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "trade_sovereign")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")

db_client: AsyncIOMotorClient = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client, db
    db_client = AsyncIOMotorClient(MONGO_URL)
    db = db_client[DB_NAME]
    # Create indexes
    await db.users.create_index("firebase_uid", unique=True)
    await db.users.create_index("email")
    await db.products.create_index("category")
    await db.orders.create_index("user_id")
    await db.conversations.create_index("user_id")
    # Seed AI settings if not exists
    existing_ai = await db.ai_settings.find_one()
    if not existing_ai:
        await db.ai_settings.insert_one({
            "model_name": "gemini-3-flash-preview",
            "prompt_template": "You are Trade Sovereign AI, an expert trading assistant. Provide insightful analysis about markets, trading strategies, risk management, and financial concepts. Be helpful, accurate, and always include a disclaimer that this is not financial advice.",
            "has_api_key": True,
            "updated_at": datetime.now(timezone.utc)
        })
    yield
    db_client.close()

app = FastAPI(title="Trade Sovereign API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Pydantic Models =====
class User(BaseModel):
    id: str
    email: str
    displayName: Optional[str] = None
    role: Literal["user", "admin"] = "user"
    loyaltyPoints: int = 0
    createdAt: str

class Category(BaseModel):
    id: str
    name: str
    slug: str
    productCount: Optional[int] = 0
    createdAt: str

class Product(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    salePrice: Optional[float] = None
    category: str
    tags: List[str] = []
    stock: int = 0
    imageUrl: Optional[str] = None
    isDigital: bool = False
    isSubscription: bool = False
    createdAt: str

class MediaItem(BaseModel):
    id: str
    title: str
    type: Literal["music", "movie"]
    price: float
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    fileUrl: Optional[str] = None
    licenseType: str = "standard"
    createdAt: str

class OrderItem(BaseModel):
    id: str
    productId: Optional[str] = None
    mediaId: Optional[str] = None
    name: Optional[str] = None
    price: float
    quantity: int

class Order(BaseModel):
    id: str
    userId: str
    razorpayOrderId: Optional[str] = None
    status: Literal["pending", "paid", "failed", "refunded"] = "pending"
    total: float
    items: List[OrderItem] = []
    createdAt: str

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: float
    yearlyPrice: float
    features: List[str] = []
    isPopular: bool = False

class Subscription(BaseModel):
    id: str
    userId: str
    planType: Literal["free", "pro", "elite"] = "free"
    status: Literal["active", "cancelled", "expired"] = "active"
    expiresAt: Optional[str] = None
    createdAt: str

class Page(BaseModel):
    id: str
    title: str
    slug: str
    content: str
    contentType: Literal["markdown", "html"] = "markdown"
    isPublished: bool = False
    createdAt: str
    updatedAt: str

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class Conversation(BaseModel):
    id: str
    userId: str
    title: str
    messages: List[ChatMessage]
    createdAt: str
    updatedAt: str

# ===== Request/Response Models =====
class CreateProductRequest(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    salePrice: Optional[float] = None
    category: str
    tags: List[str] = []
    stock: int = 0
    imageUrl: Optional[str] = None
    isDigital: bool = False
    isSubscription: bool = False

class CreateMediaRequest(BaseModel):
    title: str
    type: Literal["music", "movie"]
    price: float
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    fileUrl: Optional[str] = None
    licenseType: str = "standard"

class CreateCategoryRequest(BaseModel):
    name: str
    slug: str

class CreatePageRequest(BaseModel):
    title: str
    slug: str
    content: str
    contentType: Literal["markdown", "html"] = "markdown"
    isPublished: bool = False

class CreateSubscriptionPlanRequest(BaseModel):
    name: str
    price: float
    yearlyPrice: float
    features: List[str] = []
    isPopular: bool = False

class CartItem(BaseModel):
    id: str
    quantity: int
    type: Literal["product", "media"]

class CreateOrderRequest(BaseModel):
    items: List[CartItem]
    type: Literal["product", "media", "subscription"]
    subscriptionPlan: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    orderId: str
    razorpayOrderId: str
    razorpayPaymentId: str
    razorpaySignature: str

class AiChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Optional[str] = None

class AiAnalyzeRequest(BaseModel):
    query: str
    symbol: Optional[str] = None

class SaveConversationRequest(BaseModel):
    title: str
    messages: List[ChatMessage]

class UpdateAiSettingsRequest(BaseModel):
    modelName: Optional[str] = None
    promptTemplate: Optional[str] = None
    apiKey: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    displayName: Optional[str] = None

class UpdateUserRoleRequest(BaseModel):
    role: Literal["user", "admin"]

# ===== Authentication Dependency =====
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded["uid"]
        email = decoded.get("email", "")
        
        # Get or create user in MongoDB
        user_doc = await db.users.find_one({"firebase_uid": uid})
        if not user_doc:
            # Create user
            role = "admin" if email == ADMIN_EMAIL else "user"
            user_doc = {
                "firebase_uid": uid,
                "email": email,
                "display_name": decoded.get("name"),
                "role": role,
                "loyalty_points": 0,
                "created_at": datetime.now(timezone.utc)
            }
            result = await db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
        
        return {
            "id": str(user_doc.get("_id")),
            "firebase_uid": uid,
            "email": user_doc.get("email", email),
            "display_name": user_doc.get("display_name"),
            "role": user_doc.get("role", "user"),
            "loyalty_points": user_doc.get("loyalty_points", 0),
            "created_at": user_doc.get("created_at", datetime.now(timezone.utc))
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

async def require_admin(user = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===== Helper Functions =====
def serialize_doc(doc, id_field="_id"):
    if doc is None:
        return None
    doc["id"] = str(doc.pop(id_field))
    if "created_at" in doc:
        doc["createdAt"] = doc.pop("created_at").isoformat() if isinstance(doc.get("created_at"), datetime) else str(doc.get("created_at", ""))
    if "updated_at" in doc:
        doc["updatedAt"] = doc.pop("updated_at").isoformat() if isinstance(doc.get("updated_at"), datetime) else str(doc.get("updated_at", ""))
    if "firebase_uid" in doc:
        del doc["firebase_uid"]
    if "display_name" in doc:
        doc["displayName"] = doc.pop("display_name")
    if "loyalty_points" in doc:
        doc["loyaltyPoints"] = doc.pop("loyalty_points")
    if "sale_price" in doc:
        doc["salePrice"] = doc.pop("sale_price")
    if "image_url" in doc:
        doc["imageUrl"] = doc.pop("image_url")
    if "file_url" in doc:
        doc["fileUrl"] = doc.pop("file_url")
    if "is_digital" in doc:
        doc["isDigital"] = doc.pop("is_digital")
    if "is_subscription" in doc:
        doc["isSubscription"] = doc.pop("is_subscription")
    if "license_type" in doc:
        doc["licenseType"] = doc.pop("license_type")
    if "product_count" in doc:
        doc["productCount"] = doc.pop("product_count")
    if "is_published" in doc:
        doc["isPublished"] = doc.pop("is_published")
    if "content_type" in doc:
        doc["contentType"] = doc.pop("content_type")
    if "user_id" in doc:
        doc["userId"] = doc.pop("user_id")
    if "razorpay_order_id" in doc:
        doc["razorpayOrderId"] = doc.pop("razorpay_order_id")
    if "plan_type" in doc:
        doc["planType"] = doc.pop("plan_type")
    if "expires_at" in doc:
        doc["expiresAt"] = doc.pop("expires_at").isoformat() if isinstance(doc.get("expires_at"), datetime) else str(doc.get("expires_at", ""))
    if "yearly_price" in doc:
        doc["yearlyPrice"] = doc.pop("yearly_price")
    if "is_popular" in doc:
        doc["isPopular"] = doc.pop("is_popular")
    if "model_name" in doc:
        doc["modelName"] = doc.pop("model_name")
    if "prompt_template" in doc:
        doc["promptTemplate"] = doc.pop("prompt_template")
    if "has_api_key" in doc:
        doc["hasApiKey"] = doc.pop("has_api_key")
    return doc

# ===== Health Check =====
@app.get("/api/healthz")
async def health_check():
    return {"status": "ok"}

# ===== Auth Routes =====
@app.get("/api/auth/me")
async def get_me(user = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "displayName": user.get("display_name"),
        "role": user["role"],
        "loyaltyPoints": user["loyalty_points"],
        "createdAt": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else str(user["created_at"])
    }

@app.put("/api/auth/profile")
async def update_profile(req: UpdateProfileRequest, user = Depends(get_current_user)):
    update_data = {}
    if req.displayName is not None:
        update_data["display_name"] = req.displayName
    
    if update_data:
        await db.users.update_one({"firebase_uid": user["firebase_uid"]}, {"$set": update_data})
    
    updated = await db.users.find_one({"firebase_uid": user["firebase_uid"]})
    return serialize_doc(updated)

# ===== Categories =====
@app.get("/api/categories")
async def list_categories():
    cats = await db.categories.find().to_list(100)
    # Count products per category
    for cat in cats:
        count = await db.products.count_documents({"category": cat.get("slug", cat.get("name", "").lower())})
        cat["product_count"] = count
    return {"categories": [serialize_doc(c) for c in cats], "total": len(cats)}

@app.get("/api/categories/{id}")
async def get_category(id: str):
    from bson import ObjectId
    cat = await db.categories.find_one({"_id": ObjectId(id)})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return serialize_doc(cat)

# ===== Products =====
@app.get("/api/products")
async def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    page: int = 1,
    limit: int = 20
):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if tag:
        query["tags"] = tag
    if minPrice is not None:
        query["price"] = {"$gte": minPrice}
    if maxPrice is not None:
        if "price" in query:
            query["price"]["$lte"] = maxPrice
        else:
            query["price"] = {"$lte": maxPrice}
    
    skip = (page - 1) * limit
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    return {"products": [serialize_doc(p) for p in products], "total": total, "page": page, "limit": limit}

@app.get("/api/products/{id}")
async def get_product(id: str):
    from bson import ObjectId
    from bson.errors import InvalidId
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    product = await db.products.find_one({"_id": oid})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_doc(product)

# ===== Media =====
@app.get("/api/media")
async def list_media(
    type: Optional[Literal["music", "movie"]] = None,
    page: int = 1,
    limit: int = 20
):
    query = {}
    if type:
        query["type"] = type
    
    skip = (page - 1) * limit
    items = await db.media.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.media.count_documents(query)
    
    return {"items": [serialize_doc(m) for m in items], "total": total, "page": page, "limit": limit}

@app.get("/api/media/{id}")
async def get_media_item(id: str):
    from bson import ObjectId
    item = await db.media.find_one({"_id": ObjectId(id)})
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
    return serialize_doc(item)

@app.get("/api/media/{id}/download")
async def get_media_download(id: str, user = Depends(get_current_user)):
    from bson import ObjectId
    # Check if user has purchased this media
    order = await db.orders.find_one({
        "user_id": user["id"],
        "status": "paid",
        "items.mediaId": id
    })
    if not order:
        raise HTTPException(status_code=403, detail="You haven't purchased this media")
    
    item = await db.media.find_one({"_id": ObjectId(id)})
    if not item or not item.get("file_url"):
        raise HTTPException(status_code=404, detail="Download not available")
    
    # Generate temporary download URL (in production, use signed URLs)
    return {
        "url": item.get("file_url"),
        "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    }

# ===== Orders =====
@app.get("/api/orders")
async def list_orders(user = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return {"orders": [serialize_doc(o) for o in orders], "total": len(orders)}

@app.get("/api/orders/{id}")
async def get_order(id: str, user = Depends(get_current_user)):
    from bson import ObjectId
    order = await db.orders.find_one({"_id": ObjectId(id), "user_id": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_doc(order)

# ===== Payments (Razorpay) =====
@app.post("/api/payments/create-order")
async def create_payment_order(req: CreateOrderRequest, user = Depends(get_current_user)):
    from bson import ObjectId
    
    total = 0
    order_items = []
    
    for item in req.items:
        if item.type == "product":
            product = await db.products.find_one({"_id": ObjectId(item.id)})
            if product:
                price = product.get("sale_price") or product.get("price", 0)
                total += price * item.quantity
                order_items.append({
                    "id": str(uuid.uuid4()),
                    "productId": item.id,
                    "name": product.get("name"),
                    "price": price,
                    "quantity": item.quantity
                })
        elif item.type == "media":
            media = await db.media.find_one({"_id": ObjectId(item.id)})
            if media:
                total += media.get("price", 0) * item.quantity
                order_items.append({
                    "id": str(uuid.uuid4()),
                    "mediaId": item.id,
                    "name": media.get("title"),
                    "price": media.get("price", 0),
                    "quantity": item.quantity
                })
    
    if req.type == "subscription" and req.subscriptionPlan:
        plan = await db.subscription_plans.find_one({"_id": ObjectId(req.subscriptionPlan)})
        if plan:
            total = plan.get("price", 0)
            order_items.append({
                "id": str(uuid.uuid4()),
                "name": f"{plan.get('name')} Subscription",
                "price": plan.get("price", 0),
                "quantity": 1
            })
    
    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid order total")
    
    # Create Razorpay order
    amount_paise = int(total * 100)
    razorpay_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"order_{datetime.now().timestamp()}",
        "payment_capture": 1
    })
    
    # Save order to DB
    order_doc = {
        "user_id": user["id"],
        "razorpay_order_id": razorpay_order["id"],
        "status": "pending",
        "total": total,
        "items": order_items,
        "type": req.type,
        "subscription_plan": req.subscriptionPlan,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.orders.insert_one(order_doc)
    
    return {
        "orderId": str(result.inserted_id),
        "razorpayOrderId": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "keyId": os.environ.get("RAZORPAY_KEY_ID")
    }

@app.post("/api/payments/verify")
async def verify_payment(req: VerifyPaymentRequest, user = Depends(get_current_user)):
    from bson import ObjectId
    
    # Verify Razorpay signature
    message = f"{req.razorpayOrderId}|{req.razorpayPaymentId}"
    secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    generated_signature = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if generated_signature != req.razorpaySignature:
        await db.orders.update_one(
            {"_id": ObjectId(req.orderId)},
            {"$set": {"status": "failed"}}
        )
        return {"success": False, "orderId": req.orderId, "message": "Payment verification failed"}
    
    # Update order status
    order = await db.orders.find_one({"_id": ObjectId(req.orderId)})
    if order:
        await db.orders.update_one(
            {"_id": ObjectId(req.orderId)},
            {"$set": {"status": "paid", "razorpay_payment_id": req.razorpayPaymentId}}
        )
        
        # Award loyalty points (1 point per ₹10)
        points_earned = int(order.get("total", 0) / 10)
        if points_earned > 0:
            await db.users.update_one(
                {"_id": ObjectId(user["id"])},
                {"$inc": {"loyalty_points": points_earned}}
            )
            await db.rewards.insert_one({
                "user_id": user["id"],
                "points": points_earned,
                "type": "purchase",
                "description": f"Earned from order {req.orderId}",
                "created_at": datetime.now(timezone.utc)
            })
        
        # Handle subscription
        if order.get("type") == "subscription" and order.get("subscription_plan"):
            plan = await db.subscription_plans.find_one({"_id": ObjectId(order["subscription_plan"])})
            if plan:
                await db.subscriptions.update_one(
                    {"user_id": user["id"]},
                    {"$set": {
                        "plan_type": plan.get("name", "pro").lower(),
                        "status": "active",
                        "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
                        "created_at": datetime.now(timezone.utc)
                    }},
                    upsert=True
                )
    
    return {"success": True, "orderId": req.orderId, "message": "Payment verified successfully"}

# ===== Subscriptions =====
@app.get("/api/subscriptions/my")
async def get_my_subscription(user = Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"user_id": user["id"]})
    if not sub:
        return {
            "id": "",
            "userId": user["id"],
            "planType": "free",
            "status": "active",
            "expiresAt": None,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
    return serialize_doc(sub)

@app.get("/api/subscriptions/plans")
async def list_subscription_plans():
    plans = await db.subscription_plans.find().to_list(10)
    return {"plans": [serialize_doc(p) for p in plans]}

# ===== Rewards =====
@app.get("/api/rewards/my")
async def get_my_rewards(user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])}) if user["id"] else None
    total_points = user_doc.get("loyalty_points", 0) if user_doc else user.get("loyalty_points", 0)
    
    # Determine tier
    tier = "Bronze"
    if total_points >= 10000:
        tier = "Diamond"
    elif total_points >= 5000:
        tier = "Platinum"
    elif total_points >= 1000:
        tier = "Gold"
    elif total_points >= 500:
        tier = "Silver"
    
    history = await db.rewards.find({"user_id": user["id"]}).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "totalPoints": total_points,
        "tier": tier,
        "history": [serialize_doc(h) for h in history]
    }

# ===== AI Routes =====
@app.post("/api/ai/chat")
async def ai_chat(req: AiChatRequest, user = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get AI settings
    ai_settings = await db.ai_settings.find_one()
    model_name = ai_settings.get("model_name", "gemini-3-flash-preview") if ai_settings else "gemini-3-flash-preview"
    system_prompt = ai_settings.get("prompt_template", "You are Trade Sovereign AI, an expert trading assistant.") if ai_settings else "You are Trade Sovereign AI, an expert trading assistant."
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"trade_sovereign_{user['id']}_{datetime.now().timestamp()}",
        system_message=system_prompt
    ).with_model("gemini", model_name)
    
    # Build conversation history
    for msg in req.history:
        if msg.role == "user":
            await chat.send_message(UserMessage(text=msg.content))
    
    # Send current message
    user_message = UserMessage(text=req.message)
    response = await chat.send_message(user_message)
    
    return {"reply": response, "tokensUsed": 0}

@app.post("/api/ai/analyze")
async def ai_analyze(req: AiAnalyzeRequest, user = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    ai_settings = await db.ai_settings.find_one()
    model_name = ai_settings.get("model_name", "gemini-3-flash-preview") if ai_settings else "gemini-3-flash-preview"
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    
    analyze_prompt = f"""Analyze this trading query and provide structured insights:
Query: {req.query}
{f'Symbol: {req.symbol}' if req.symbol else ''}

Respond in this exact JSON format:
{{
    "analysis": "Your detailed analysis here",
    "sentiment": "bullish" or "bearish" or "neutral",
    "keyPoints": ["point 1", "point 2", "point 3"],
    "disclaimer": "This is for educational purposes only, not financial advice."
}}"""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"analyze_{user['id']}_{datetime.now().timestamp()}",
        system_message="You are a market analysis AI. Always respond with valid JSON."
    ).with_model("gemini", model_name)
    
    response = await chat.send_message(UserMessage(text=analyze_prompt))
    
    # Parse response
    import json
    try:
        # Try to extract JSON from response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        data = json.loads(response_text)
        return {
            "analysis": data.get("analysis", response),
            "sentiment": data.get("sentiment", "neutral"),
            "keyPoints": data.get("keyPoints", []),
            "disclaimer": data.get("disclaimer", "This is for educational purposes only, not financial advice.")
        }
    except:
        return {
            "analysis": response,
            "sentiment": "neutral",
            "keyPoints": [],
            "disclaimer": "This is for educational purposes only, not financial advice."
        }

@app.post("/api/ai/search")
async def ai_search(req: dict):
    query = req.get("query", "")
    # Search products based on query
    products = await db.products.find({
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"tags": {"$in": [query.lower()]}}
        ]
    }).limit(10).to_list(10)
    
    return {
        "results": [serialize_doc(p) for p in products],
        "interpretation": f"Found {len(products)} products matching '{query}'"
    }

@app.get("/api/ai/conversations")
async def list_conversations(user = Depends(get_current_user)):
    convs = await db.conversations.find({"user_id": user["id"]}).sort("updated_at", -1).to_list(50)
    return {"conversations": [serialize_doc(c) for c in convs]}

@app.post("/api/ai/conversations")
async def save_conversation(req: SaveConversationRequest, user = Depends(get_current_user)):
    conv_doc = {
        "user_id": user["id"],
        "title": req.title,
        "messages": [m.dict() for m in req.messages],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = await db.conversations.insert_one(conv_doc)
    conv_doc["_id"] = result.inserted_id
    return serialize_doc(conv_doc)

@app.delete("/api/ai/conversations/{id}")
async def delete_conversation(id: str, user = Depends(get_current_user)):
    from bson import ObjectId
    result = await db.conversations.delete_one({"_id": ObjectId(id), "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True, "message": "Conversation deleted"}

# ===== Pages =====
@app.get("/api/pages")
async def list_pages():
    pages = await db.pages.find({"is_published": True}).to_list(100)
    return {"pages": [serialize_doc(p) for p in pages], "total": len(pages)}

@app.get("/api/pages/{slug}")
async def get_page(slug: str):
    page = await db.pages.find_one({"slug": slug, "is_published": True})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return serialize_doc(page)

# ===== Admin Routes =====
from bson import ObjectId

@app.get("/api/admin/stats")
async def admin_get_stats(admin = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    total_media = await db.media.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    
    # Calculate total revenue
    paid_orders = await db.orders.find({"status": "paid"}).to_list(1000)
    total_revenue = sum(o.get("total", 0) for o in paid_orders)
    
    # Recent orders
    recent = await db.orders.find().sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "totalUsers": total_users,
        "totalOrders": total_orders,
        "totalRevenue": total_revenue,
        "totalProducts": total_products,
        "totalMediaItems": total_media,
        "activeSubscriptions": active_subs,
        "recentOrders": [serialize_doc(o) for o in recent]
    }

@app.get("/api/admin/analytics")
async def admin_get_analytics(period: str = "30d", admin = Depends(require_admin)):
    days = 30 if period == "30d" else 7 if period == "7d" else 90
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Revenue by day
    pipeline = [
        {"$match": {"status": "paid", "created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "revenue": {"$sum": "$total"},
            "orders": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    revenue_data = await db.orders.aggregate(pipeline).to_list(100)
    revenue_by_day = [{"date": r["_id"], "revenue": r["revenue"], "orders": r["orders"]} for r in revenue_data]
    
    # Top products
    product_pipeline = [
        {"$match": {"status": "paid"}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.name",
            "sales": {"$sum": "$items.quantity"},
            "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": 5}
    ]
    top_products = await db.orders.aggregate(product_pipeline).to_list(5)
    
    # Orders by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    orders_by_status = await db.orders.aggregate(status_pipeline).to_list(10)
    
    # New users by day
    user_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    new_users = await db.users.aggregate(user_pipeline).to_list(100)
    
    return {
        "revenueByDay": revenue_by_day,
        "topProducts": [{"name": p["_id"] or "Unknown", "sales": p["sales"], "revenue": p["revenue"]} for p in top_products],
        "ordersByStatus": [{"status": s["_id"], "count": s["count"]} for s in orders_by_status],
        "newUsersByDay": [{"date": u["_id"], "count": u["count"]} for u in new_users]
    }

@app.get("/api/admin/products")
async def admin_list_products(admin = Depends(require_admin)):
    products = await db.products.find().to_list(500)
    return {"products": [serialize_doc(p) for p in products], "total": len(products)}

@app.post("/api/admin/products")
async def admin_create_product(req: CreateProductRequest, admin = Depends(require_admin)):
    product_doc = {
        "name": req.name,
        "description": req.description,
        "price": req.price,
        "sale_price": req.salePrice,
        "category": req.category,
        "tags": req.tags,
        "stock": req.stock,
        "image_url": req.imageUrl,
        "is_digital": req.isDigital,
        "is_subscription": req.isSubscription,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.products.insert_one(product_doc)
    product_doc["_id"] = result.inserted_id
    return serialize_doc(product_doc)

@app.put("/api/admin/products/{id}")
async def admin_update_product(id: str, req: CreateProductRequest, admin = Depends(require_admin)):
    update_data = {k: v for k, v in {
        "name": req.name,
        "description": req.description,
        "price": req.price,
        "sale_price": req.salePrice,
        "category": req.category,
        "tags": req.tags,
        "stock": req.stock,
        "image_url": req.imageUrl,
        "is_digital": req.isDigital,
        "is_subscription": req.isSubscription
    }.items() if v is not None}
    
    await db.products.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    product = await db.products.find_one({"_id": ObjectId(id)})
    return serialize_doc(product)

@app.delete("/api/admin/products/{id}")
async def admin_delete_product(id: str, admin = Depends(require_admin)):
    result = await db.products.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "message": "Product deleted"}

@app.get("/api/admin/media")
async def admin_list_media(admin = Depends(require_admin)):
    items = await db.media.find().to_list(500)
    return {"items": [serialize_doc(m) for m in items], "total": len(items)}

@app.post("/api/admin/media")
async def admin_create_media(req: CreateMediaRequest, admin = Depends(require_admin)):
    media_doc = {
        "title": req.title,
        "type": req.type,
        "price": req.price,
        "description": req.description,
        "image_url": req.imageUrl,
        "file_url": req.fileUrl,
        "license_type": req.licenseType,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.media.insert_one(media_doc)
    media_doc["_id"] = result.inserted_id
    return serialize_doc(media_doc)

@app.get("/api/admin/users")
async def admin_list_users(admin = Depends(require_admin)):
    users = await db.users.find().to_list(500)
    return {"users": [serialize_doc(u) for u in users], "total": len(users)}

@app.put("/api/admin/users/{id}/role")
async def admin_update_user_role(id: str, req: UpdateUserRoleRequest, admin = Depends(require_admin)):
    await db.users.update_one({"_id": ObjectId(id)}, {"$set": {"role": req.role}})
    return {"success": True, "message": f"User role updated to {req.role}"}

@app.get("/api/admin/categories")
async def admin_list_categories(admin = Depends(require_admin)):
    cats = await db.categories.find().to_list(100)
    for cat in cats:
        count = await db.products.count_documents({"category": cat.get("slug", "")})
        cat["product_count"] = count
    return {"categories": [serialize_doc(c) for c in cats], "total": len(cats)}

@app.post("/api/admin/categories")
async def admin_create_category(req: CreateCategoryRequest, admin = Depends(require_admin)):
    cat_doc = {
        "name": req.name,
        "slug": req.slug,
        "product_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.categories.insert_one(cat_doc)
    cat_doc["_id"] = result.inserted_id
    return serialize_doc(cat_doc)

@app.put("/api/admin/categories/{id}")
async def admin_update_category(id: str, req: CreateCategoryRequest, admin = Depends(require_admin)):
    await db.categories.update_one({"_id": ObjectId(id)}, {"$set": {"name": req.name, "slug": req.slug}})
    cat = await db.categories.find_one({"_id": ObjectId(id)})
    return serialize_doc(cat)

@app.delete("/api/admin/categories/{id}")
async def admin_delete_category(id: str, admin = Depends(require_admin)):
    result = await db.categories.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "message": "Category deleted"}

@app.get("/api/admin/pages")
async def admin_list_pages(admin = Depends(require_admin)):
    pages = await db.pages.find().to_list(100)
    return {"pages": [serialize_doc(p) for p in pages], "total": len(pages)}

@app.post("/api/admin/pages")
async def admin_create_page(req: CreatePageRequest, admin = Depends(require_admin)):
    page_doc = {
        "title": req.title,
        "slug": req.slug,
        "content": req.content,
        "content_type": req.contentType,
        "is_published": req.isPublished,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = await db.pages.insert_one(page_doc)
    page_doc["_id"] = result.inserted_id
    return serialize_doc(page_doc)

@app.put("/api/admin/pages/{id}")
async def admin_update_page(id: str, req: CreatePageRequest, admin = Depends(require_admin)):
    await db.pages.update_one({"_id": ObjectId(id)}, {"$set": {
        "title": req.title,
        "slug": req.slug,
        "content": req.content,
        "content_type": req.contentType,
        "is_published": req.isPublished,
        "updated_at": datetime.now(timezone.utc)
    }})
    page = await db.pages.find_one({"_id": ObjectId(id)})
    return serialize_doc(page)

@app.delete("/api/admin/pages/{id}")
async def admin_delete_page(id: str, admin = Depends(require_admin)):
    result = await db.pages.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"success": True, "message": "Page deleted"}

@app.get("/api/admin/ai-settings")
async def admin_get_ai_settings(admin = Depends(require_admin)):
    settings = await db.ai_settings.find_one()
    if not settings:
        return {
            "id": "",
            "modelName": "gemini-3-flash-preview",
            "promptTemplate": "",
            "hasApiKey": True,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
    return serialize_doc(settings)

@app.put("/api/admin/ai-settings")
async def admin_update_ai_settings(req: UpdateAiSettingsRequest, admin = Depends(require_admin)):
    update_data = {"updated_at": datetime.now(timezone.utc)}
    if req.modelName:
        update_data["model_name"] = req.modelName
    if req.promptTemplate:
        update_data["prompt_template"] = req.promptTemplate
    if req.apiKey:
        update_data["has_api_key"] = True
    
    await db.ai_settings.update_one({}, {"$set": update_data}, upsert=True)
    settings = await db.ai_settings.find_one()
    return serialize_doc(settings)

@app.get("/api/admin/subscription-plans")
async def admin_list_subscription_plans(admin = Depends(require_admin)):
    plans = await db.subscription_plans.find().to_list(20)
    return {"plans": [serialize_doc(p) for p in plans]}

@app.post("/api/admin/subscription-plans")
async def admin_create_subscription_plan(req: CreateSubscriptionPlanRequest, admin = Depends(require_admin)):
    plan_doc = {
        "name": req.name,
        "price": req.price,
        "yearly_price": req.yearlyPrice,
        "features": req.features,
        "is_popular": req.isPopular,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.subscription_plans.insert_one(plan_doc)
    plan_doc["_id"] = result.inserted_id
    return serialize_doc(plan_doc)

@app.put("/api/admin/subscription-plans/{id}")
async def admin_update_subscription_plan(id: str, req: CreateSubscriptionPlanRequest, admin = Depends(require_admin)):
    await db.subscription_plans.update_one({"_id": ObjectId(id)}, {"$set": {
        "name": req.name,
        "price": req.price,
        "yearly_price": req.yearlyPrice,
        "features": req.features,
        "is_popular": req.isPopular
    }})
    plan = await db.subscription_plans.find_one({"_id": ObjectId(id)})
    return serialize_doc(plan)

@app.delete("/api/admin/subscription-plans/{id}")
async def admin_delete_subscription_plan(id: str, admin = Depends(require_admin)):
    result = await db.subscription_plans.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"success": True, "message": "Plan deleted"}

# ===== Copy Trading =====
class TraderProfile(BaseModel):
    userId: str
    displayName: str
    bio: Optional[str] = None
    totalReturn: float = 0
    winRate: float = 0
    copiers: int = 0
    isVerified: bool = False

class CreateTradeSignalRequest(BaseModel):
    symbol: str
    action: Literal["buy", "sell"]
    entryPrice: float
    targetPrice: Optional[float] = None
    stopLoss: Optional[float] = None
    confidence: float = 50
    notes: Optional[str] = None

class CopyTraderRequest(BaseModel):
    traderId: str
    allocation: float = 1000  # Amount to allocate for copy trading

@app.get("/api/copy-trading/traders")
async def list_traders(
    sortBy: str = "copiers",
    page: int = 1,
    limit: int = 20
):
    """List all traders available for copy trading"""
    sort_field = {"copiers": "copiers", "return": "total_return", "winrate": "win_rate"}.get(sortBy, "copiers")
    skip = (page - 1) * limit
    
    traders = await db.traders.find({"is_public": True}).sort(sort_field, -1).skip(skip).limit(limit).to_list(limit)
    total = await db.traders.count_documents({"is_public": True})
    
    # Serialize traders
    result = []
    for t in traders:
        t["id"] = str(t.pop("_id"))
        if "user_id" in t:
            t["userId"] = t.pop("user_id")
        if "display_name" in t:
            t["displayName"] = t.pop("display_name")
        if "total_return" in t:
            t["totalReturn"] = t.pop("total_return")
        if "win_rate" in t:
            t["winRate"] = t.pop("win_rate")
        if "is_verified" in t:
            t["isVerified"] = t.pop("is_verified")
        if "is_public" in t:
            t["isPublic"] = t.pop("is_public")
        if "created_at" in t:
            t["createdAt"] = t.pop("created_at").isoformat() if isinstance(t.get("created_at"), datetime) else str(t.get("created_at", ""))
        result.append(t)
    
    return {"traders": result, "total": total, "page": page, "limit": limit}

@app.get("/api/copy-trading/traders/{id}")
async def get_trader_profile(id: str):
    """Get trader profile with stats and recent signals"""
    from bson.errors import InvalidId
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid trader ID")
    
    trader = await db.traders.find_one({"_id": oid})
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")
    
    # Get recent signals
    signals = await db.trade_signals.find({"trader_id": id}).sort("created_at", -1).limit(10).to_list(10)
    
    trader["id"] = str(trader.pop("_id"))
    if "user_id" in trader:
        trader["userId"] = trader.pop("user_id")
    if "display_name" in trader:
        trader["displayName"] = trader.pop("display_name")
    if "total_return" in trader:
        trader["totalReturn"] = trader.pop("total_return")
    if "win_rate" in trader:
        trader["winRate"] = trader.pop("win_rate")
    if "is_verified" in trader:
        trader["isVerified"] = trader.pop("is_verified")
    if "created_at" in trader:
        trader["createdAt"] = trader.pop("created_at").isoformat() if isinstance(trader.get("created_at"), datetime) else ""
    
    # Serialize signals
    serialized_signals = []
    for s in signals:
        s["id"] = str(s.pop("_id"))
        if "trader_id" in s:
            s["traderId"] = s.pop("trader_id")
        if "entry_price" in s:
            s["entryPrice"] = s.pop("entry_price")
        if "target_price" in s:
            s["targetPrice"] = s.pop("target_price")
        if "stop_loss" in s:
            s["stopLoss"] = s.pop("stop_loss")
        if "created_at" in s:
            s["createdAt"] = s.pop("created_at").isoformat() if isinstance(s.get("created_at"), datetime) else ""
        serialized_signals.append(s)
    
    trader["recentSignals"] = serialized_signals
    return trader

@app.get("/api/copy-trading/signals")
async def list_trade_signals(traderId: Optional[str] = None, page: int = 1, limit: int = 20):
    """List trade signals from traders"""
    query = {}
    if traderId:
        query["trader_id"] = traderId
    
    skip = (page - 1) * limit
    signals = await db.trade_signals.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.trade_signals.count_documents(query)
    
    result = []
    for s in signals:
        s["id"] = str(s.pop("_id"))
        if "trader_id" in s:
            s["traderId"] = s.pop("trader_id")
        if "entry_price" in s:
            s["entryPrice"] = s.pop("entry_price")
        if "target_price" in s:
            s["targetPrice"] = s.pop("target_price")
        if "stop_loss" in s:
            s["stopLoss"] = s.pop("stop_loss")
        if "created_at" in s:
            s["createdAt"] = s.pop("created_at").isoformat() if isinstance(s.get("created_at"), datetime) else ""
        result.append(s)
    
    return {"signals": result, "total": total}

@app.post("/api/copy-trading/become-trader")
async def become_trader(user = Depends(get_current_user)):
    """Register as a trader for copy trading"""
    # Check if already a trader
    existing = await db.traders.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as trader")
    
    trader_doc = {
        "user_id": user["id"],
        "display_name": user.get("display_name") or "Trader",
        "bio": "",
        "total_return": 0,
        "win_rate": 0,
        "copiers": 0,
        "total_trades": 0,
        "winning_trades": 0,
        "is_verified": False,
        "is_public": True,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.traders.insert_one(trader_doc)
    trader_doc["_id"] = result.inserted_id
    
    return {"success": True, "traderId": str(result.inserted_id), "message": "You are now a trader!"}

@app.post("/api/copy-trading/signals")
async def create_trade_signal(req: CreateTradeSignalRequest, user = Depends(get_current_user)):
    """Create a new trade signal (for traders)"""
    # Check if user is a trader
    trader = await db.traders.find_one({"user_id": user["id"]})
    if not trader:
        raise HTTPException(status_code=403, detail="You must be a registered trader to create signals")
    
    signal_doc = {
        "trader_id": str(trader["_id"]),
        "symbol": req.symbol.upper(),
        "action": req.action,
        "entry_price": req.entryPrice,
        "target_price": req.targetPrice,
        "stop_loss": req.stopLoss,
        "confidence": req.confidence,
        "notes": req.notes,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.trade_signals.insert_one(signal_doc)
    
    # Update trader stats
    await db.traders.update_one(
        {"_id": trader["_id"]},
        {"$inc": {"total_trades": 1}}
    )
    
    signal_doc["id"] = str(result.inserted_id)
    return {"success": True, "signal": signal_doc}

@app.post("/api/copy-trading/copy/{traderId}")
async def copy_trader(traderId: str, req: CopyTraderRequest, user = Depends(get_current_user)):
    """Start copying a trader"""
    from bson.errors import InvalidId
    try:
        trader_oid = ObjectId(traderId)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid trader ID")
    
    trader = await db.traders.find_one({"_id": trader_oid})
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")
    
    # Check if already copying
    existing = await db.copy_relationships.find_one({
        "copier_id": user["id"],
        "trader_id": traderId,
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already copying this trader")
    
    copy_doc = {
        "copier_id": user["id"],
        "trader_id": traderId,
        "allocation": req.allocation,
        "status": "active",
        "total_copied_trades": 0,
        "profit_loss": 0,
        "created_at": datetime.now(timezone.utc)
    }
    await db.copy_relationships.insert_one(copy_doc)
    
    # Increment copiers count
    await db.traders.update_one({"_id": trader_oid}, {"$inc": {"copiers": 1}})
    
    return {"success": True, "message": f"Now copying {trader.get('display_name', 'Trader')}"}

@app.delete("/api/copy-trading/copy/{traderId}")
async def stop_copying(traderId: str, user = Depends(get_current_user)):
    """Stop copying a trader"""
    result = await db.copy_relationships.update_one(
        {"copier_id": user["id"], "trader_id": traderId, "status": "active"},
        {"$set": {"status": "stopped", "stopped_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Not copying this trader")
    
    # Decrement copiers count
    await db.traders.update_one({"_id": ObjectId(traderId)}, {"$inc": {"copiers": -1}})
    
    return {"success": True, "message": "Stopped copying trader"}

@app.get("/api/copy-trading/my-copies")
async def get_my_copies(user = Depends(get_current_user)):
    """Get traders I'm copying"""
    copies = await db.copy_relationships.find({
        "copier_id": user["id"],
        "status": "active"
    }).to_list(50)
    
    result = []
    for c in copies:
        trader = await db.traders.find_one({"_id": ObjectId(c["trader_id"])})
        if trader:
            result.append({
                "id": str(c["_id"]),
                "traderId": c["trader_id"],
                "traderName": trader.get("display_name", "Trader"),
                "allocation": c.get("allocation", 0),
                "profitLoss": c.get("profit_loss", 0),
                "totalCopiedTrades": c.get("total_copied_trades", 0),
                "createdAt": c["created_at"].isoformat() if isinstance(c.get("created_at"), datetime) else ""
            })
    
    return {"copies": result}

@app.get("/api/copy-trading/my-trader-profile")
async def get_my_trader_profile(user = Depends(get_current_user)):
    """Get my trader profile if I'm a trader"""
    trader = await db.traders.find_one({"user_id": user["id"]})
    if not trader:
        return {"isTrader": False}
    
    trader["id"] = str(trader.pop("_id"))
    trader["isTrader"] = True
    if "user_id" in trader:
        trader["userId"] = trader.pop("user_id")
    if "display_name" in trader:
        trader["displayName"] = trader.pop("display_name")
    if "total_return" in trader:
        trader["totalReturn"] = trader.pop("total_return")
    if "win_rate" in trader:
        trader["winRate"] = trader.pop("win_rate")
    if "is_verified" in trader:
        trader["isVerified"] = trader.pop("is_verified")
    if "total_trades" in trader:
        trader["totalTrades"] = trader.pop("total_trades")
    if "winning_trades" in trader:
        trader["winningTrades"] = trader.pop("winning_trades")
    if "created_at" in trader:
        trader["createdAt"] = trader.pop("created_at").isoformat() if isinstance(trader.get("created_at"), datetime) else ""
    
    return trader

@app.put("/api/copy-trading/my-trader-profile")
async def update_my_trader_profile(bio: str = "", user = Depends(get_current_user)):
    """Update my trader profile"""
    result = await db.traders.update_one(
        {"user_id": user["id"]},
        {"$set": {"bio": bio}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Not a registered trader")
    return {"success": True}

# ===== Automated Trade Execution =====
class BrokerConnection(BaseModel):
    broker: Literal["zerodha", "upstox", "angelone", "groww", "demo"]
    apiKey: Optional[str] = None
    apiSecret: Optional[str] = None
    accessToken: Optional[str] = None

class AutoExecutionSettings(BaseModel):
    enabled: bool = False
    maxTradeSize: float = 1000
    riskPerTrade: float = 2.0  # percentage
    autoStopLoss: bool = True
    confirmBeforeExecute: bool = True

class ExecuteTradeRequest(BaseModel):
    signalId: str
    quantity: Optional[int] = None
    customEntryPrice: Optional[float] = None

@app.post("/api/broker/connect")
async def connect_broker(req: BrokerConnection, user = Depends(get_current_user)):
    """Connect a broker account for automated trading"""
    # Check if already connected
    existing = await db.broker_connections.find_one({"user_id": user["id"]})
    
    broker_doc = {
        "user_id": user["id"],
        "broker": req.broker,
        "api_key": req.apiKey,
        "api_secret": req.apiSecret,
        "access_token": req.accessToken,
        "status": "connected" if req.broker == "demo" else "pending_verification",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if existing:
        await db.broker_connections.update_one(
            {"user_id": user["id"]},
            {"$set": broker_doc}
        )
    else:
        await db.broker_connections.insert_one(broker_doc)
    
    return {
        "success": True,
        "broker": req.broker,
        "status": broker_doc["status"],
        "message": f"Connected to {req.broker}" if req.broker == "demo" else f"Broker {req.broker} pending verification"
    }

@app.get("/api/broker/status")
async def get_broker_status(user = Depends(get_current_user)):
    """Get broker connection status"""
    connection = await db.broker_connections.find_one({"user_id": user["id"]})
    if not connection:
        return {"connected": False, "broker": None}
    
    return {
        "connected": connection.get("status") == "connected",
        "broker": connection.get("broker"),
        "status": connection.get("status"),
        "connectedAt": connection.get("created_at").isoformat() if connection.get("created_at") else None
    }

@app.delete("/api/broker/disconnect")
async def disconnect_broker(user = Depends(get_current_user)):
    """Disconnect broker account"""
    result = await db.broker_connections.delete_one({"user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No broker connected")
    return {"success": True, "message": "Broker disconnected"}

@app.get("/api/auto-execution/settings")
async def get_auto_execution_settings(user = Depends(get_current_user)):
    """Get auto execution settings"""
    settings = await db.auto_execution_settings.find_one({"user_id": user["id"]})
    if not settings:
        return {
            "enabled": False,
            "maxTradeSize": 1000,
            "riskPerTrade": 2.0,
            "autoStopLoss": True,
            "confirmBeforeExecute": True
        }
    
    return {
        "enabled": settings.get("enabled", False),
        "maxTradeSize": settings.get("max_trade_size", 1000),
        "riskPerTrade": settings.get("risk_per_trade", 2.0),
        "autoStopLoss": settings.get("auto_stop_loss", True),
        "confirmBeforeExecute": settings.get("confirm_before_execute", True)
    }

@app.put("/api/auto-execution/settings")
async def update_auto_execution_settings(req: AutoExecutionSettings, user = Depends(get_current_user)):
    """Update auto execution settings"""
    # Check broker connection
    broker = await db.broker_connections.find_one({"user_id": user["id"], "status": "connected"})
    if not broker and req.enabled:
        raise HTTPException(status_code=400, detail="Connect a broker first to enable auto execution")
    
    settings_doc = {
        "user_id": user["id"],
        "enabled": req.enabled,
        "max_trade_size": req.maxTradeSize,
        "risk_per_trade": req.riskPerTrade,
        "auto_stop_loss": req.autoStopLoss,
        "confirm_before_execute": req.confirmBeforeExecute,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.auto_execution_settings.update_one(
        {"user_id": user["id"]},
        {"$set": settings_doc},
        upsert=True
    )
    
    return {"success": True, "message": "Settings updated"}

@app.post("/api/auto-execution/execute")
async def execute_trade(req: ExecuteTradeRequest, user = Depends(get_current_user)):
    """Execute a trade signal"""
    from bson.errors import InvalidId
    
    # Verify broker connection
    broker = await db.broker_connections.find_one({"user_id": user["id"], "status": "connected"})
    if not broker:
        raise HTTPException(status_code=400, detail="No broker connected")
    
    # Get signal
    try:
        signal = await db.trade_signals.find_one({"_id": ObjectId(req.signalId)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid signal ID")
    
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    # Get settings
    settings = await db.auto_execution_settings.find_one({"user_id": user["id"]})
    max_size = settings.get("max_trade_size", 1000) if settings else 1000
    
    # Calculate quantity
    entry_price = req.customEntryPrice or signal.get("entry_price", 0)
    quantity = req.quantity or int(max_size / entry_price) if entry_price > 0 else 0
    
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid quantity calculated")
    
    # Create execution record
    execution_doc = {
        "user_id": user["id"],
        "signal_id": req.signalId,
        "broker": broker.get("broker"),
        "symbol": signal.get("symbol"),
        "action": signal.get("action"),
        "quantity": quantity,
        "entry_price": entry_price,
        "target_price": signal.get("target_price"),
        "stop_loss": signal.get("stop_loss"),
        "status": "executed" if broker.get("broker") == "demo" else "pending",
        "executed_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.trade_executions.insert_one(execution_doc)
    
    # Update copy relationship stats
    trader_id = signal.get("trader_id")
    if trader_id:
        await db.copy_relationships.update_one(
            {"copier_id": user["id"], "trader_id": trader_id, "status": "active"},
            {"$inc": {"total_copied_trades": 1}}
        )
    
    return {
        "success": True,
        "executionId": str(result.inserted_id),
        "symbol": signal.get("symbol"),
        "action": signal.get("action"),
        "quantity": quantity,
        "entryPrice": entry_price,
        "status": execution_doc["status"],
        "message": f"Trade {'executed' if broker.get('broker') == 'demo' else 'submitted'} successfully"
    }

@app.get("/api/auto-execution/history")
async def get_execution_history(page: int = 1, limit: int = 20, user = Depends(get_current_user)):
    """Get trade execution history"""
    skip = (page - 1) * limit
    executions = await db.trade_executions.find({"user_id": user["id"]}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.trade_executions.count_documents({"user_id": user["id"]})
    
    result = []
    for e in executions:
        result.append({
            "id": str(e.pop("_id")),
            "signalId": e.get("signal_id"),
            "broker": e.get("broker"),
            "symbol": e.get("symbol"),
            "action": e.get("action"),
            "quantity": e.get("quantity"),
            "entryPrice": e.get("entry_price"),
            "targetPrice": e.get("target_price"),
            "stopLoss": e.get("stop_loss"),
            "status": e.get("status"),
            "executedAt": e.get("executed_at").isoformat() if e.get("executed_at") else None,
            "createdAt": e.get("created_at").isoformat() if e.get("created_at") else None
        })
    
    return {"executions": result, "total": total, "page": page, "limit": limit}

@app.get("/api/auto-execution/pending")
async def get_pending_signals(user = Depends(get_current_user)):
    """Get pending signals from copied traders that haven't been executed"""
    # Get active copy relationships
    copies = await db.copy_relationships.find({
        "copier_id": user["id"],
        "status": "active"
    }).to_list(50)
    
    if not copies:
        return {"signals": []}
    
    trader_ids = [c["trader_id"] for c in copies]
    
    # Get signals from copied traders
    signals = await db.trade_signals.find({
        "trader_id": {"$in": trader_ids},
        "status": "active"
    }).sort("created_at", -1).limit(20).to_list(20)
    
    # Get already executed signals
    executed = await db.trade_executions.find({"user_id": user["id"]}).to_list(1000)
    executed_signal_ids = {e.get("signal_id") for e in executed}
    
    # Filter out already executed
    pending = []
    for s in signals:
        signal_id = str(s["_id"])
        if signal_id not in executed_signal_ids:
            # Get trader info
            trader = await db.traders.find_one({"_id": ObjectId(s["trader_id"])})
            pending.append({
                "id": signal_id,
                "traderId": s.get("trader_id"),
                "traderName": trader.get("display_name", "Trader") if trader else "Unknown",
                "symbol": s.get("symbol"),
                "action": s.get("action"),
                "entryPrice": s.get("entry_price"),
                "targetPrice": s.get("target_price"),
                "stopLoss": s.get("stop_loss"),
                "confidence": s.get("confidence"),
                "notes": s.get("notes"),
                "createdAt": s.get("created_at").isoformat() if s.get("created_at") else None
            })
    
    return {"signals": pending}

@app.post("/api/auto-execution/execute-all-pending")
async def execute_all_pending(user = Depends(get_current_user)):
    """Execute all pending signals from copied traders"""
    # Get settings
    settings = await db.auto_execution_settings.find_one({"user_id": user["id"]})
    if not settings or not settings.get("enabled"):
        raise HTTPException(status_code=400, detail="Auto execution is not enabled")
    
    # Get broker
    broker = await db.broker_connections.find_one({"user_id": user["id"], "status": "connected"})
    if not broker:
        raise HTTPException(status_code=400, detail="No broker connected")
    
    # Get pending signals
    pending_response = await get_pending_signals(user)
    pending = pending_response.get("signals", [])
    
    if not pending:
        return {"success": True, "executed": 0, "message": "No pending signals to execute"}
    
    executed_count = 0
    max_size = settings.get("max_trade_size", 1000)
    
    for signal in pending:
        entry_price = signal.get("entryPrice", 0)
        if entry_price <= 0:
            continue
            
        quantity = int(max_size / entry_price)
        if quantity <= 0:
            continue
        
        execution_doc = {
            "user_id": user["id"],
            "signal_id": signal["id"],
            "broker": broker.get("broker"),
            "symbol": signal.get("symbol"),
            "action": signal.get("action"),
            "quantity": quantity,
            "entry_price": entry_price,
            "target_price": signal.get("targetPrice"),
            "stop_loss": signal.get("stopLoss"),
            "status": "executed" if broker.get("broker") == "demo" else "pending",
            "executed_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.trade_executions.insert_one(execution_doc)
        executed_count += 1
        
        # Update copy relationship
        if signal.get("traderId"):
            await db.copy_relationships.update_one(
                {"copier_id": user["id"], "trader_id": signal["traderId"], "status": "active"},
                {"$inc": {"total_copied_trades": 1}}
            )
    
    return {
        "success": True,
        "executed": executed_count,
        "message": f"Executed {executed_count} trades"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
