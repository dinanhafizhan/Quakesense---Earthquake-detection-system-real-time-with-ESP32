from typing import List, Dict, Optional
from app.database import get_connection

# -------- Inserts --------

def insert_region1(getaran: float, suhu: Optional[float] = None,  gas: Optional[float] = None):
    sql = """
        INSERT INTO sensor_data_region1 (getaran, suhu,  gas)
        VALUES (%s, %s,  %s)
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (getaran, suhu, gas))

def insert_region2(getaran: float, tekanan: Optional[float] = None):
    sql = """
        INSERT INTO sensor_data_region2 (getaran, tekanan)
        VALUES (%s, %s)
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (getaran, tekanan))

# -------- Latest per region --------

def get_latest_region1() -> Optional[Dict]:
    sql = "SELECT * FROM sensor_data_region1 ORDER BY timestamp DESC LIMIT 1"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone()
            return row

def get_latest_region2() -> Optional[Dict]:
    sql = "SELECT * FROM sensor_data_region2 ORDER BY timestamp DESC LIMIT 1"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone()
            return row

def get_latest_both() -> List[Dict]:
    r1 = get_latest_region1()
    r2 = get_latest_region2()
    out: List[Dict] = []
    if r1:
        d = dict(r1)
        d["wilayah"] = "region1"
        out.append(d)
    if r2:
        d = dict(r2)
        d["wilayah"] = "region2"
        out.append(d)
    return out

# -------- Lists --------

def get_data_region1(limit: int = 100) -> List[Dict]:
    sql = "SELECT * FROM sensor_data_region1 ORDER BY timestamp DESC LIMIT %s"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (limit,))
            return cur.fetchall()

def get_data_region2(limit: int = 100) -> List[Dict]:
    sql = "SELECT * FROM sensor_data_region2 ORDER BY timestamp DESC LIMIT %s"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (limit,))
            return cur.fetchall()
        
def get_stats_region1() -> Optional[Dict]:
    sql = """
        SELECT 
            MAX(getaran) as max_getaran, AVG(getaran) as avg_getaran,
            MAX(suhu) as max_suhu, AVG(suhu) as avg_suhu,
            MAX(gas) as max_gas, AVG(gas) as avg_gas
        FROM sensor_data_region1
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchone()

def get_stats_region2() -> Optional[Dict]:
    # Menghitung Max dan Average untuk Region 2
    sql = """
        SELECT 
            MAX(getaran) as max_getaran, AVG(getaran) as avg_getaran,
            MAX(tekanan) as max_tekanan, AVG(tekanan) as avg_tekanan
        FROM sensor_data_region2
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchone()