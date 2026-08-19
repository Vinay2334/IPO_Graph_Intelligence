import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError
from dotenv import load_dotenv

load_dotenv()

URI = os.getenv("COGNODB_URI")
USER = os.getenv("COGNODB_USER", "cognodb")
PASSWORD = os.getenv("COGNODB_PASSWORD")

driver = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global driver
    if not URI or not PASSWORD:
        print("Warning: Database credentials are not set in environment.")
    else:
        try:
            driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
            driver.verify_connectivity()
            print("Connected successfully to CognoDB Cloud over Bolt Protocol.")
        except (ServiceUnavailable, AuthError) as e:
            print(f"Failed to connect to CognoDB Cloud: {e}")
    yield
    if driver:
        driver.close()

app = FastAPI(title="IPO Risk & Intelligence Graph Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_session():
    if not driver:
        raise HTTPException(
            status_code=503, 
            detail="Database connection is unavailable. Verify CognoDB environment variables."
        )
    return driver.session()

@app.get("/api/health")
def health_check():
    if not driver:
        return {"status": "unhealthy", "db": "disconnected"}
    try:
        driver.verify_connectivity()
        return {"status": "healthy", "db": "connected"}
    except Exception as e:
        return {"status": "degraded", "error": str(e)}

@app.get("/api/companies")
def list_companies():
    with get_session() as session:
        query = """
            MATCH (c:Company)
            OPTIONAL MATCH (c)<-[:IMPACTS|SYSTEMIC_DRAG|REPORTS_ON*1..2]-(a:Article)
            RETURN c.id AS id,
                   c.name AS name,
                   c.status AS status,
                   c.sector AS sector,
                   c.priceBand AS priceBand,
                   c.issueSize AS issueSize,
                   c.valuation AS valuation,
                   c.listingGain AS listingGain,
                   avg(a.sentimentScore) AS avgSentiment,
                   count(DISTINCT a) AS articleCount
            ORDER BY c.name ASC
        """
        records = session.run(query).data()
        return records

@app.get("/api/analysis/{company_id}")
def analyze_company(company_id: str):
    with get_session() as session:
        exists_check = session.run(
            "MATCH (c:Company {id: $id}) RETURN c.name AS name", 
            {"id": company_id}
        ).single()
        
        if not exists_check:
            raise HTTPException(status_code=404, detail="Company not found")

        contagion_query = """
            MATCH (target:Company {id: $id})
            MATCH path = (target)<-[r1:UNDERWRITTEN_BY|BACKED_BY|HOLDS_POSITION|CONSORTIUM_PARTNER|SYSTEMIC_DRAG*1..2]-(intermediary)
                         <-[r2:REPORTS_ON|IMPACTS]-(art:Article)
            RETURN intermediary.name AS intermediaryName,
                    intermediary.id AS intermediaryId,
                   labels(intermediary)[0] AS intermediaryType,
                   type(last(relationships(path))) AS relationType,
                   art.id AS articleId,
                   art.title AS title,
                   art.url AS url,
                   art.publisher AS publisher,
                   art.sentimentScore AS sentimentScore,
                   art.sentimentLabel AS sentimentLabel,
                   art.summary AS summary
            ORDER BY art.sentimentScore ASC
        """
        contagion_risks = session.run(contagion_query, {"id": company_id}).data()

        direct_news_query = """
            MATCH (target:Company {id: $id})<-[:REPORTS_ON]-(art:Article)
            RETURN art.id AS articleId,
                   art.title AS title,
                   art.url AS url,
                   art.publisher AS publisher,
                   art.sentimentScore AS sentimentScore,
                   art.sentimentLabel AS sentimentLabel,
                   art.summary AS summary
            ORDER BY art.sentimentScore ASC
        """
        direct_news = session.run(direct_news_query, {"id": company_id}).data()

        subgraph_query = """
            MATCH (target:Company {id: $id})
            OPTIONAL MATCH path = (target)-[r*1..2]-(connected)
            WHERE none(lbl IN labels(connected) WHERE lbl = 'Article' AND NOT (connected)-[:REPORTS_ON]->(target) AND NOT (connected)-[:REPORTS_ON]->()-[]->(target))
            WITH collect(path) AS paths, target
            UNWIND (CASE WHEN size(paths) = 0 THEN [null] ELSE paths END) AS p
            WITH target, 
                 collect(DISTINCT target) + collect(DISTINCT nodes(p)) AS allNodesList,
                 collect(DISTINCT relationships(p)) AS allRelsList
            UNWIND allNodesList AS nList
            UNWIND nList AS n
            UNWIND allRelsList AS rList
            UNWIND rList AS rel
            WITH collect(DISTINCT {
                id: n.id,
                label: labels(n)[0],
                name: coalesce(n.name, n.title),
                sentiment: coalesce(n.sentimentScore, 0.0),
                status: coalesce(n.status, '')
            }) AS rawNodes,
            collect(DISTINCT {
                source: startNode(rel).id,
                target: endNode(rel).id,
                type: type(rel)
            }) AS rawEdges
            RETURN rawNodes AS nodes, rawEdges AS edges
        """
        subgraph = session.run(subgraph_query, {"id": company_id}).single()

        return {
            "companyId": company_id,
            "companyName": exists_check["name"],
            "directNews": direct_news,
            "contagionRisks": contagion_risks,
            "graph": {
                "nodes": [n for n in subgraph["nodes"] if n and n["id"]],
                "edges": [e for e in subgraph["edges"] if e and e["source"] and e["target"]]
            }
        }