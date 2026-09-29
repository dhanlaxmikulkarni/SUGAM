import os
import json
import sqlite3
import secrets
import hashlib
import time
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, request, g
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("SUGAM_DB_PATH", BASE_DIR / "data" / "sugam.db"))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DEMO_OTP = "1234"
AVG_TRUCK_SPEED_KMH = 36

DEMO_DEMANDS = [
    {"id": "demo-demand-1", "residueType": "Bagasse", "application": "Paper & Pulp", "quantity": 60, "rate": 1650,
     "location": "Pune, Maharashtra", "requiredDate": "Ongoing / monthly",
     "qualityRequirements": "Moisture below 15%, clean loads only", "recurring": True, "status": "active"},
    {"id": "demo-demand-2", "residueType": "Press Mud", "application": "Bio-fertilizer", "quantity": 35, "rate": 1100,
     "location": "Satara, Maharashtra", "requiredDate": "Within 2 weeks",
     "qualityRequirements": "Free from plastic/foreign contamination", "recurring": True, "status": "active"},
    {"id": "demo-demand-3", "residueType": "Sugarcane Leaves", "application": "Biogas & Energy", "quantity": 20, "rate": 950,
     "location": "Kolhapur, Maharashtra", "requiredDate": "Flexible",
     "qualityRequirements": "Covered/dry storage preferred", "recurring": False, "status": "active"},
]

DEMO_INDUSTRY = {
    "orgName": "Sahyadri Paper Works",
    "sector": "Paper & Pulp",
    "location": "Pune, Maharashtra",
    "contactName": "Aniket Joshi",
    "contactPhone": "9822011223",
    "contactEmail": "procurement@sahyadripaper.example",
    "regNumber": "27ABCDE1234F1Z5",
    "submitted": True,
    "registrationId": "SUGAM-IND-2026-2007",
    "verified": True,
}

DEMO_FARMER = {
    "registration": {
        "step": 8,
        "mobile": {"number": "9876543210", "otp": "", "sentOtp": "", "verified": True, "resendIn": 0},
        "personal": {"fullName": "Vitthal Shinde", "dob": "1985-04-12", "gender": "Male",
                     "farmerType": "Individual Farmer", "email": "vitthal.shinde@example.com"},
        "address": {"state": "Maharashtra", "district": "Pune", "taluka": "Baramati", "village": "Malegaon", "pin": "413102"},
        "farm": {"landStatus": "Owned", "landArea": "6.5", "landUnit": "Acre", "mainCrops": "Sugarcane",
                 "residueTypes": ["Bagasse", "Sugarcane Leaves"], "availability": "Available now"},
        "kyc": {"docType": "Aadhaar", "docNumber": "234567890123", "status": "Submitted (Demo)"},
        "bank": {"accountHolder": "Vitthal Shinde", "accountNumber": "50100234567890",
                 "confirmAccountNumber": "50100234567890", "ifsc": "HDFC0001234",
                 "bankName": "HDFC Bank", "branch": "Baramati", "accountType": "Savings", "status": "Submitted (Demo)"},
        "documents": [],
        "consent": True,
        "submitted": True,
        "registrationId": "SUGAM-FARMER-2026-1042",
        "submittedAt": time.time() - 40 * 86400,
    },
    "profile": {
        "name": "Vitthal Shinde", "location": "Baramati, Maharashtra", "wasteType": "Bagasse",
        "quantity": "22", "availableFrom": "Available now", "moisture": "Low",
        "contamination": "None", "storage": "Covered shed", "qualityNotes": "", "retainedOverride": ""
    }
}

DEMO_SHIPMENTS = [
    {"id": "demo-shp-1001", "demand_id": "demo-demand-1", "farmerName": "Vitthal Shinde",
     "residueType": "Bagasse", "quantity": 14, "origin": "Baramati, Maharashtra",
     "destination": "Sahyadri Paper Works, Pune", "distanceKm": 22, "progress": 0, "status": "SCHEDULED",
     "industryAccepted": False, "qualityVerified": False, "paymentStatus": "pending",
     "utilizationConfirmed": False, "rate": 1650, "grossAmount": 23100, "transportCost": 1320, "handlingCost": 560, "netAmount": 21220},
    {"id": "demo-shp-1002", "demand_id": "demo-demand-2", "farmerName": "Sunita Jadhav",
     "residueType": "Press Mud", "quantity": 9, "origin": "Karad, Maharashtra",
     "destination": "Krishi BioInputs, Satara", "distanceKm": 34, "progress": 0, "status": "SCHEDULED",
     "industryAccepted": True, "qualityVerified": False, "paymentStatus": "pending",
     "utilizationConfirmed": False, "rate": 1100, "grossAmount": 9900, "transportCost": 2040, "handlingCost": 360, "netAmount": 7500},
    {"id": "demo-shp-1003", "demand_id": "demo-demand-1", "farmerName": "Prakash Pawar",
     "residueType": "Bagasse", "quantity": 19, "origin": "Pune, Maharashtra",
     "destination": "Sahyadri Paper Works, Pune", "distanceKm": 15, "progress": 14, "status": "ASSIGNED",
     "industryAccepted": True, "qualityVerified": False, "paymentStatus": "pending",
     "utilizationConfirmed": False, "rate": 1650, "grossAmount": 31350, "transportCost": 900, "handlingCost": 760, "netAmount": 29690},
    {"id": "demo-shp-1004", "demand_id": "demo-demand-3", "farmerName": "Ramesh More",
     "residueType": "Sugarcane Leaves", "quantity": 11, "origin": "Satara, Maharashtra",
     "destination": "GreenGrid Energy, Baramati", "distanceKm": 29, "progress": 64, "status": "IN_TRANSIT",
     "industryAccepted": True, "qualityVerified": False, "paymentStatus": "pending",
     "utilizationConfirmed": False, "rate": 950, "grossAmount": 10450, "transportCost": 1740, "handlingCost": 440, "netAmount": 8270},
    {"id": "demo-shp-1005", "demand_id": "demo-demand-1", "farmerName": "Anil Kadam",
     "residueType": "Bagasse", "quantity": 8, "origin": "Kolhapur, Maharashtra",
     "destination": "Sahyadri Paper Works, Pune", "distanceKm": 41, "progress": 100, "status": "DELIVERED",
     "industryAccepted": True, "qualityVerified": False, "paymentStatus": "pending",
     "utilizationConfirmed": False, "rate": 1650, "grossAmount": 13200, "transportCost": 2460, "handlingCost": 320, "netAmount": 10420},
    {"id": "demo-shp-1006", "demand_id": "demo-demand-2", "farmerName": "Sunita Jadhav",
     "residueType": "Press Mud", "quantity": 12, "origin": "Karad, Maharashtra",
     "destination": "Krishi BioInputs, Satara", "distanceKm": 34, "progress": 100, "status": "DELIVERED",
     "industryAccepted": True, "qualityVerified": True, "paymentStatus": "completed",
     "utilizationConfirmed": False, "rate": 1100, "grossAmount": 13200, "transportCost": 2040, "handlingCost": 480, "netAmount": 10680},
    {"id": "demo-shp-1007", "demand_id": "demo-demand-1", "farmerName": "Vitthal Shinde",
     "residueType": "Bagasse", "quantity": 16, "origin": "Baramati, Maharashtra",
     "destination": "Sahyadri Paper Works, Pune", "distanceKm": 22, "progress": 100, "status": "DELIVERED",
     "industryAccepted": True, "qualityVerified": True, "paymentStatus": "completed",
     "utilizationConfirmed": True, "rate": 1650, "grossAmount": 26400, "transportCost": 1320, "handlingCost": 640, "netAmount": 24440},
]

def now_ms():
    return int(time.time() * 1000)

def db():
    if "db" not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db

@app.teardown_appcontext
def close_db(_exc):
    conn = g.pop("db", None)
    if conn:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        identifier TEXT NOT NULL,
        password_hash TEXT,
        registration_json TEXT NOT NULL DEFAULT '{}',
        profile_json TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_users_role_identifier ON users(role, identifier);

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS demands (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        farmer_user_id TEXT NOT NULL,
        industry_user_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    );
    """)
    conn.commit()
    conn.close()

def jdump(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))

def jload(raw, default=None):
    try:
        return json.loads(raw)
    except Exception:
        return default if default is not None else {}

def user_row(user_id):
    return db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

def create_user(role, identifier, registration=None, profile=None, user_id=None):
    uid = user_id or f"{role}-{secrets.token_hex(8)}"
    conn = db()
    conn.execute(
        "INSERT INTO users(id, role, identifier, registration_json, profile_json, created_at) VALUES(?,?,?,?,?,?)",
        (uid, role, identifier, jdump(registration or {}), jdump(profile or {}), now_ms())
    )
    conn.commit()
    return uid

def issue_session(user_id):
    token = secrets.token_urlsafe(32)
    db().execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)", (token, user_id, now_ms()))
    db().commit()
    return token

def current_user():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:].strip()
    row = db().execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?",
        (token,)
    ).fetchone()
    return row

def require_auth(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        g.user = user
        return fn(*args, **kwargs)
    return wrapped

def notify_user(user_id, message, tone="success"):
    nid = f"n-{secrets.token_hex(8)}"
    payload = {"id": nid, "message": message, "tone": tone, "read": False, "at": now_ms()}
    db().execute("INSERT INTO notifications(id,user_id,data_json,updated_at) VALUES(?,?,?,?)",
                 (nid, user_id, jdump(payload), now_ms()))
    return payload

def make_event(event_type, label, actor="System", detail=""):
    return {"id": f"evt-{event_type}-{now_ms()}-{secrets.randbelow(1000)}",
            "type": event_type, "label": label, "actor": actor, "at": now_ms(), "detail": detail}

def get_demand(demand_id):
    row = db().execute("SELECT * FROM demands WHERE id=?", (demand_id,)).fetchone()
    return row

def public_industries():
    rows = db().execute("SELECT id, owner_user_id, data_json FROM demands WHERE json_extract(data_json,'$.status')='active'").fetchall()
    out = []
    for r in rows:
        d = jload(r["data_json"])
        owner = user_row(r["owner_user_id"])
        reg = jload(owner["registration_json"]) if owner else {}
        out.append({
            "id": d["id"], "name": reg.get("orgName") or "Registered Industry", "type": d.get("application"),
            "wasteType": d.get("residueType"), "location": d.get("location") or reg.get("location") or "—",
            "distance": 24, "demand": float(d.get("quantity") or 0), "rate": float(d.get("rate") or 0),
            "contact": reg.get("contactName") or "Industry representative", "verified": bool(reg.get("verified")),
        })
    return out

def shipment_payload(row):
    payload = jload(row["data_json"])
    payload["id"] = row["id"]
    return payload

def bootstrap(user):
    role = user["role"]
    uid = user["id"]
    reg = jload(user["registration_json"])
    profile = jload(user["profile_json"])
    if role == "farmer":
        srows = db().execute("SELECT * FROM shipments WHERE farmer_user_id=? ORDER BY updated_at DESC", (uid,)).fetchall()
        demands = []
    else:
        srows = db().execute("SELECT * FROM shipments WHERE industry_user_id=? ORDER BY updated_at DESC", (uid,)).fetchall()
        demands = [jload(r["data_json"]) for r in db().execute(
            "SELECT data_json FROM demands WHERE owner_user_id=? ORDER BY updated_at DESC", (uid,)
        ).fetchall()]
    notifs = [jload(r["data_json"]) for r in db().execute(
        "SELECT data_json FROM notifications WHERE user_id=? ORDER BY updated_at DESC LIMIT 60", (uid,)
    ).fetchall()]
    connected = list({shipment_payload(r).get("industryId") for r in srows if shipment_payload(r).get("industryId")})
    return {
        "user": {"id": uid, "role": role, "identifier": user["identifier"]},
        "farmerReg": reg if role == "farmer" else None,
        "industryReg": reg if role == "industry" else None,
        "farmer": profile if role == "farmer" else {},
        "industryDemands": demands,
        "shipments": [shipment_payload(r) for r in srows],
        "notifications": notifs,
        "industries": public_industries(),
        "connected": connected,
    }

def seed_demo():
    conn = db()
    existing_f = conn.execute("SELECT id FROM users WHERE id='demo-farmer'").fetchone()
    if not existing_f:
        conn.execute(
            "INSERT INTO users(id,role,identifier,registration_json,profile_json,created_at) VALUES(?,?,?,?,?,?)",
            ("demo-farmer","farmer","9876543210",jdump(DEMO_FARMER["registration"]),jdump(DEMO_FARMER["profile"]),now_ms())
        )
    existing_i = conn.execute("SELECT id FROM users WHERE id='demo-industry'").fetchone()
    if not existing_i:
        conn.execute(
            "INSERT INTO users(id,role,identifier,registration_json,profile_json,created_at) VALUES(?,?,?,?,?,?)",
            ("demo-industry","industry","9822011223",jdump(DEMO_INDUSTRY),jdump(DEMO_INDUSTRY),now_ms())
        )
    for d in DEMO_DEMANDS:
        conn.execute(
            "INSERT OR IGNORE INTO demands(id,owner_user_id,data_json,updated_at) VALUES(?,?,?,?)",
            (d["id"],"demo-industry",jdump({**d,"createdAt":now_ms()-10*86400000,"updatedAt":now_ms()}),now_ms())
        )
    demo_names = sorted({s["farmerName"] for s in DEMO_SHIPMENTS if s["farmerName"] != "Vitthal Shinde"})
    for name in demo_names:
        fid = "demo-farmer-" + hashlib.sha1(name.encode("utf-8")).hexdigest()[:8]
        if not conn.execute("SELECT id FROM users WHERE id=?", (fid,)).fetchone():
            conn.execute(
                "INSERT INTO users(id,role,identifier,registration_json,profile_json,created_at) VALUES(?,?,?,?,?,?)",
                (fid, "farmer", fid, jdump({"personal":{"fullName":name},"submitted":True,"registrationId":fid}),
                 jdump({"name":name,"location":"","wasteType":"","quantity":"","availableFrom":""}), now_ms())
            )
    for idx, s in enumerate(DEMO_SHIPMENTS):
        sid=s["id"]
        if conn.execute("SELECT id FROM shipments WHERE id=?", (sid,)).fetchone():
            continue
        created = now_ms() - (idx+1)*86400000
        industry_user = "demo-industry"
        # Keep demo farmer as owner so the cross-role demo can show the same records.
        data = {
            "id": sid,
            "industryId": s["demand_id"],
            "industryName": next((d["application"] for d in DEMO_DEMANDS if d["id"] == s["demand_id"]), "Industry"),
            "farmerName": s["farmerName"], "residueType": s["residueType"], "quantity": s["quantity"],
            "origin": s["origin"], "destination": s["destination"], "distanceKm": s["distanceKm"],
            "estTravelHours": s["distanceKm"]/AVG_TRUCK_SPEED_KMH, "progress": s["progress"], "status": s["status"],
            "createdAt": created, "industryAccepted": s["industryAccepted"], "industryAcceptedAt": created if s["industryAccepted"] else None,
            "passportId": f"SGM-DEMO-{sid[-4:]}", "transactionId": f"TXN-DEMO-{sid[-4:]}",
            "qualitySummary": "Low moisture • Clean", "qualityVerified": s.get("qualityVerified",False),
            "qualityVerifiedAt": created + 10000 if s.get("qualityVerified") else None,
            "paymentStatus": s.get("paymentStatus","pending"), "paymentAt": created + 20000 if s.get("paymentStatus")=="completed" else None,
            "utilizationConfirmed": s.get("utilizationConfirmed",False), "utilizationConfirmedAt": created + 30000 if s.get("utilizationConfirmed") else None,
            "cancelled": False, "cancelledAt": None,
            "rate": s["rate"], "grossAmount": s["grossAmount"], "transportCost": s["transportCost"], "handlingCost": s["handlingCost"], "netAmount": s["netAmount"],
            "events": [make_event("REQUEST_SENT","Connection request seeded for demo","Farmer")]
        }
        if data["industryAccepted"]:
            data["events"].append(make_event("INDUSTRY_ACCEPTED","Industry accepted the connection request","Industry"))
        if data["progress"] > 0:
            data["events"].append(make_event("TRACKING_STAGE",data["status"],"System"))
        if data["qualityVerified"]:
            data["events"].append(make_event("QUALITY_VERIFIED","Quality verified","Industry"))
        if data["paymentStatus"]=="completed":
            data["events"].append(make_event("PAYMENT_COMPLETED","Payment completed","Industry"))
        if data["utilizationConfirmed"]:
            data["events"].append(make_event("UTILIZATION_CONFIRMED","Utilization confirmed","Industry"))
        farmer_uid = "demo-farmer" if s["farmerName"] == "Vitthal Shinde" else "demo-farmer-" + hashlib.sha1(s["farmerName"].encode("utf-8")).hexdigest()[:8]
        conn.execute(
            "INSERT INTO shipments(id,farmer_user_id,industry_user_id,data_json,updated_at) VALUES(?,?,?,?,?)",
            (sid, farmer_uid, industry_user, jdump(data), now_ms())
        )
    # Seed only when empty.
    if conn.execute("SELECT COUNT(*) FROM notifications WHERE user_id='demo-farmer'").fetchone()[0] == 0:
        for msg,tone,h in [
            ("Demo payment completed for SGM-BGS demo shipment","success",2),
            ("Quality verified by industry (demo action)","success",6),
            ("Vehicle assigned for your scheduled pickup","success",20),
        ]:
            conn.execute("INSERT INTO notifications(id,user_id,data_json,updated_at) VALUES(?,?,?,?)",
                         (f"demo-f-{secrets.token_hex(5)}","demo-farmer",jdump({"id":f"demo-{secrets.token_hex(5)}","message":msg,"tone":tone,"read":h>24,"at":now_ms()-h*3600000}),now_ms()))
    if conn.execute("SELECT COUNT(*) FROM notifications WHERE user_id='demo-industry'").fetchone()[0] == 0:
        for msg in ["New farmer requests are available in Incoming Requests","Quality verification is pending on a delivered lot","Demo payment completed for a procurement"]:
            conn.execute("INSERT INTO notifications(id,user_id,data_json,updated_at) VALUES(?,?,?,?)",
                         (f"demo-i-{secrets.token_hex(5)}","demo-industry",jdump({"id":f"demo-{secrets.token_hex(5)}","message":msg,"tone":"success","read":False,"at":now_ms()}),now_ms()))
    conn.commit()

@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "SUGAM backend", "database": str(DB_PATH)})

@app.post("/api/auth/register/<role>")
def register(role):
    if role not in ("farmer","industry"):
        return jsonify({"error":"Unsupported role"}),400
    body=request.get_json(silent=True) or {}
    identifier=(body.get("identifier") or "").strip()
    registration=body.get("registration") or {}
    profile=body.get("profile") or {}
    if not identifier:
        return jsonify({"error":"Identifier is required"}),400
    exists=db().execute("SELECT id FROM users WHERE role=? AND identifier=?", (role,identifier)).fetchone()
    if exists:
        return jsonify({"error":"An account with this identifier already exists"}),409
    uid=create_user(role, identifier, registration, profile)
    if role=="industry":
        notify_user(uid,"Welcome to SUGAM. Publish a demand to start matching.", "success")
    else:
        notify_user(uid,"Welcome to SUGAM. Complete your residue profile to start matching.", "success")
    token=issue_session(uid)
    user=user_row(uid)
    return jsonify({"token":token, "bootstrap":bootstrap(user)}),201

@app.post("/api/auth/login")
def login():
    body=request.get_json(silent=True) or {}
    role=body.get("role")
    identifier=(body.get("identifier") or "").strip()
    otp=str(body.get("otp") or "")
    if role not in ("farmer","industry") or not identifier:
        return jsonify({"error":"Role and identifier are required"}),400
    if otp != DEMO_OTP:
        return jsonify({"error":"Invalid OTP. For this prototype use 1234."}),401
    row=db().execute("SELECT * FROM users WHERE role=? AND identifier=?", (role,identifier)).fetchone()
    if not row:
        return jsonify({"error":"No registered account found for this identifier."}),404
    token=issue_session(row["id"])
    return jsonify({"token":token, "bootstrap":bootstrap(row)})

@app.post("/api/auth/demo/<role>")
def demo_login(role):
    if role not in ("farmer","industry"):
        return jsonify({"error":"Unsupported role"}),400
    seed_demo()
    uid="demo-farmer" if role=="farmer" else "demo-industry"
    token=issue_session(uid)
    return jsonify({"token":token, "bootstrap":bootstrap(user_row(uid))})

@app.get("/api/bootstrap")
@require_auth
def get_bootstrap():
    return jsonify({"bootstrap": bootstrap(g.user)})

@app.post("/api/auth/logout")
@require_auth
def logout():
    auth=request.headers.get("Authorization","")
    token=auth[7:].strip() if auth.startswith("Bearer ") else None
    if token:
        db().execute("DELETE FROM sessions WHERE token=?", (token,))
        db().commit()
    return jsonify({"ok":True})

@app.patch("/api/profile/farmer")
@require_auth
def update_farmer_profile():
    if g.user["role"] != "farmer":
        return jsonify({"error":"Farmer only"}),403
    body=request.get_json(silent=True) or {}
    profile=body.get("profile")
    registration=body.get("registration")
    updates=[]
    values=[]
    if profile is not None:
        updates.append("profile_json=?"); values.append(jdump(profile))
    if registration is not None:
        updates.append("registration_json=?"); values.append(jdump(registration))
    if updates:
        values.append(g.user["id"])
        db().execute(f"UPDATE users SET {', '.join(updates)} WHERE id=?", values)
        db().commit()
    return jsonify({"profile":profile, "farmerReg":registration})

@app.patch("/api/profile/industry")
@require_auth
def update_industry_profile():
    if g.user["role"] != "industry":
        return jsonify({"error":"Industry only"}),403
    body=request.get_json(silent=True) or {}
    registration=body.get("registration")
    profile=body.get("profile")
    updates=[]
    values=[]
    if registration is not None:
        updates.append("registration_json=?"); values.append(jdump(registration))
    if profile is not None:
        updates.append("profile_json=?"); values.append(jdump(profile))
    if updates:
        values.append(g.user["id"])
        db().execute(f"UPDATE users SET {', '.join(updates)} WHERE id=?", values)
        db().commit()
    return jsonify({"industryReg":registration})

@app.put("/api/demands/<demand_id>")
@require_auth
def upsert_demand(demand_id):
    if g.user["role"]!="industry":
        return jsonify({"error":"Industry only"}),403
    body=request.get_json(silent=True) or {}
    demand=body.get("demand") or {}
    demand["id"]=demand_id
    demand.setdefault("updatedAt",now_ms())
    exists=get_demand(demand_id)
    conn=db()
    if exists and exists["owner_user_id"] != g.user["id"]:
        return jsonify({"error":"Not your demand"}),403
    if exists:
        conn.execute("UPDATE demands SET data_json=?, updated_at=? WHERE id=?", (jdump(demand),now_ms(),demand_id))
    else:
        conn.execute("INSERT INTO demands(id,owner_user_id,data_json,updated_at) VALUES(?,?,?,?)", (demand_id,g.user["id"],jdump(demand),now_ms()))
    conn.commit()
    return jsonify({"demand":demand})

@app.delete("/api/demands/<demand_id>")
@require_auth
def delete_demand(demand_id):
    if g.user["role"]!="industry":
        return jsonify({"error":"Industry only"}),403
    row=get_demand(demand_id)
    if not row or row["owner_user_id"] != g.user["id"]:
        return jsonify({"error":"Demand not found"}),404
    db().execute("DELETE FROM demands WHERE id=?", (demand_id,))
    db().commit()
    return jsonify({"ok":True})

@app.post("/api/shipments")
@require_auth
def create_shipment():
    if g.user["role"]!="farmer":
        return jsonify({"error":"Only a farmer can create a request"}),403
    body=request.get_json(silent=True) or {}
    incoming=body.get("shipment") or {}
    industry_id=incoming.get("industryId")
    demand=get_demand(industry_id)
    if not demand or jload(demand["data_json"]).get("status")!="active":
        return jsonify({"error":"Industry demand is no longer active"}),409
    demand_data=jload(demand["data_json"])
    owner_user_id=demand["owner_user_id"]
    shipment=dict(incoming)
    shipment["id"]=shipment.get("id") or f"{industry_id}-{now_ms()}"
    shipment["industryAccepted"]=False
    shipment["industryAcceptedAt"]=None
    shipment.setdefault("createdAt",now_ms())
    shipment.setdefault("events",[make_event("REQUEST_SENT","Connection request sent to industry","Farmer")])
    conn=db()
    existing=conn.execute("SELECT id FROM shipments WHERE id=?", (shipment["id"],)).fetchone()
    if existing:
        return jsonify({"shipment":shipment})
    conn.execute("INSERT INTO shipments(id,farmer_user_id,industry_user_id,data_json,updated_at) VALUES(?,?,?,?,?)",
                 (shipment["id"],g.user["id"],owner_user_id,jdump(shipment),now_ms()))
    notify_user(owner_user_id,
                f"New farmer request from {shipment.get('farmerName') or 'SUGAM Farmer'} — {shipment.get('quantity',0)} T {shipment.get('residueType','')}.",
                "success")
    conn.commit()
    return jsonify({"shipment":shipment}),201

@app.patch("/api/shipments/<shipment_id>")
@require_auth
def patch_shipment(shipment_id):
    row=db().execute("SELECT * FROM shipments WHERE id=?", (shipment_id,)).fetchone()
    if not row:
        return jsonify({"error":"Shipment not found"}),404
    if g.user["id"] not in (row["farmer_user_id"], row["industry_user_id"]):
        return jsonify({"error":"You are not a participant in this shipment"}),403
    body=request.get_json(silent=True) or {}
    patch=body.get("patch") or {}
    actor=body.get("actor") or ("Farmer" if g.user["role"]=="farmer" else "Industry")
    current=jload(row["data_json"])

    protected = {"industryAccepted", "qualityVerified", "paymentStatus", "utilizationConfirmed"}
    if g.user["role"] == "farmer" and protected.intersection(patch.keys()):
        return jsonify({"error":"Only the industry can accept requests, verify quality, complete payment or confirm utilization."}),403
    if g.user["role"] == "industry" and "progress" in patch:
        return jsonify({"error":"Shipment progress is controlled by logistics/transport tracking."}),403

    next_data={**current, **patch}

    if not current.get("industryAccepted") and float(next_data.get("progress") or 0) > float(current.get("progress") or 0):
        return jsonify({"error":"Tracking starts after industry accepts the request."}),409
    if not current.get("qualityVerified") and next_data.get("paymentStatus")=="completed":
        return jsonify({"error":"Quality must be verified before payment can be completed."}),409
    if next_data.get("utilizationConfirmed") and next_data.get("paymentStatus")!="completed":
        return jsonify({"error":"Utilization can only be confirmed after payment."}),409
    if next_data.get("qualityVerified") and float(next_data.get("progress") or 0) < 100:
        return jsonify({"error":"Quality can be verified only after delivery."}),409

    events=list(current.get("events") or [])
    def add(type_,label,who,detail=""):
        events.append(make_event(type_,label,who,detail=detail))

    prev_progress=float(current.get("progress") or 0)
    next_progress=float(next_data.get("progress") or 0)
    if not current.get("industryAccepted") and next_data.get("industryAccepted"):
        next_data["industryAcceptedAt"]=next_data.get("industryAcceptedAt") or now_ms()
        add("INDUSTRY_ACCEPTED","Industry accepted the connection request","Industry")
        notify_user(row["farmer_user_id"], f"Industry accepted your request for {next_data.get('passportId','the residue lot')}. Pickup can now be scheduled.", "success")
    if int(prev_progress) != int(next_progress):
        if next_progress > prev_progress:
            add("TRACKING_STAGE", next_data.get("status") or "Tracking updated","System")
            notify_user(row["industry_user_id"] if g.user["role"]=="farmer" else row["farmer_user_id"],
                        f"Tracking updated to {next_data.get('status','new stage')} for {next_data.get('passportId','this lot')}.","success")
    if not current.get("qualityVerified") and next_data.get("qualityVerified"):
        next_data["qualityVerifiedAt"]=next_data.get("qualityVerifiedAt") or now_ms()
        add("QUALITY_VERIFIED","Quality verified","Industry")
        notify_user(row["farmer_user_id"], f"Quality verified for {next_data.get('passportId','this lot')}.","success")
    if current.get("paymentStatus")!="completed" and next_data.get("paymentStatus")=="completed":
        next_data["paymentAt"]=next_data.get("paymentAt") or now_ms()
        add("PAYMENT_COMPLETED","Payment completed","Industry")
        notify_user(row["farmer_user_id"], f"Payment completed for {next_data.get('passportId','this lot')}.","success")
    if not current.get("utilizationConfirmed") and next_data.get("utilizationConfirmed"):
        next_data["utilizationConfirmedAt"]=next_data.get("utilizationConfirmedAt") or now_ms()
        add("UTILIZATION_CONFIRMED","Utilization confirmed","Industry")
        notify_user(row["farmer_user_id"], f"Utilization confirmed — lifecycle complete for {next_data.get('passportId','this lot')}.","success")
    if not current.get("cancelled") and next_data.get("cancelled"):
        next_data["cancelledAt"]=next_data.get("cancelledAt") or now_ms()
        add("CANCELLED","Transaction cancelled",actor)
        notify_user(row["farmer_user_id"] if g.user["role"]=="industry" else row["industry_user_id"],
                    f"Transaction {next_data.get('passportId','this lot')} was cancelled.","error")

    next_data["events"]=events
    conn=db()
    conn.execute("UPDATE shipments SET data_json=?,updated_at=? WHERE id=?", (jdump(next_data),now_ms(),shipment_id))
    conn.commit()
    return jsonify({"shipment":next_data})

@app.get("/api/notifications")
@require_auth
def list_notifications():
    rows=db().execute("SELECT data_json FROM notifications WHERE user_id=? ORDER BY updated_at DESC LIMIT 60",(g.user["id"],)).fetchall()
    return jsonify({"notifications":[jload(r["data_json"]) for r in rows]})

@app.post("/api/notifications/read/<notification_id>")
@require_auth
def mark_notification_read(notification_id):
    row=db().execute("SELECT data_json FROM notifications WHERE id=? AND user_id=?", (notification_id,g.user["id"])).fetchone()
    if not row:
        return jsonify({"error":"Not found"}),404
    data=jload(row["data_json"]); data["read"]=True
    db().execute("UPDATE notifications SET data_json=?,updated_at=? WHERE id=?", (jdump(data),now_ms(),notification_id))
    db().commit()
    return jsonify({"ok":True})

@app.post("/api/notifications/read-all")
@require_auth
def mark_all_read():
    rows=db().execute("SELECT id,data_json FROM notifications WHERE user_id=?",(g.user["id"],)).fetchall()
    for row in rows:
        data=jload(row["data_json"]); data["read"]=True
        db().execute("UPDATE notifications SET data_json=?,updated_at=? WHERE id=?",(jdump(data),now_ms(),row["id"]))
    db().commit()
    return jsonify({"ok":True})

init_db()

if __name__ == "__main__":
    print(f"SUGAM backend running on http://127.0.0.1:5000")
    print(f"SQLite database: {DB_PATH}")
    app.run(host=os.environ.get("HOST","0.0.0.0"), port=int(os.environ.get("PORT","5000")), debug=True)
