from fastapi import APIRouter
from fastapi.responses import FileResponse
from fastapi import Depends
from app.dependencies import get_super_admin
from app.core.database import SessionLocal
from app.models.guard_log import GuardLog
from app.models.agent_registry import Agent

import csv
import json
import os

router = APIRouter(
    prefix="/export",
    tags=["Export"]
)

EXPORT_DIR = "exports"

os.makedirs(EXPORT_DIR, exist_ok=True)
@router.get("/logs/json")
def export_logs_json(user=Depends(get_super_admin)):

    db = SessionLocal()

    logs = db.query(GuardLog).all()

    data = []

    for log in logs:

        data.append({

            "id": log.id,

            "prompt": log.prompt,

            "score": log.score,

            "decision": log.action,

            "findings": log.detections,

            "created_at": str(log.created_at)

        })

    db.close()

    filename = os.path.join(EXPORT_DIR, "logs.json")

    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

    return FileResponse(
        filename,
        filename="logs.json"
    )

@router.get("/logs/csv")
def export_logs_csv(user=Depends(get_super_admin)):

    db = SessionLocal()

    logs = db.query(GuardLog).all()

    filename = os.path.join(EXPORT_DIR, "logs.csv")

    with open(filename, "w", newline="") as csvfile:

        writer = csv.writer(csvfile)

        writer.writerow([
            "ID",
            "Prompt",
            "Score",
            "Decision",
            "Findings",
            "Created"
        ])

        for log in logs:

            writer.writerow([

                log.id,

                log.prompt,

                log.score,

                log.action,

                json.dumps(log.detections),

                log.created_at

            ])

    db.close()

    return FileResponse(
        filename,
        filename="logs.csv"
    )
@router.get("/agents/csv")
def export_agents(user=Depends(get_super_admin)):

    db = SessionLocal()

    agents = db.query(Agent).all()

    filename = os.path.join(EXPORT_DIR, "agents.csv")

    with open(filename, "w", newline="") as csvfile:

        writer = csv.writer(csvfile)

        writer.writerow([

            "Agent",

            "Trust",

            "Status",

            "Messages",

            "Last Seen"

        ])

        for a in agents:

            writer.writerow([

                a.agent_id,

                a.trust_score,

                a.status,

                a.total_messages,

                a.last_seen

            ])

    db.close()

    return FileResponse(
        filename,
        filename="agents.csv"
    )