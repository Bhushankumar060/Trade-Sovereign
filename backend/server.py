"""
Trade Sovereign - FastAPI Backend Server
Full-featured trading platform with Firebase Auth, Razorpay, and Gemini AI
"""
import os
import hashlib
import hmac
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import razorpay

load_dotenv()

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
    product = await db.products.find_one({"_id": ObjectId(id)})
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
