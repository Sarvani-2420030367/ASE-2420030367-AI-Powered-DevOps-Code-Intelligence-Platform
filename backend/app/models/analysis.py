import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    health_score = Column(Float, default=100.0)
    quality_score = Column(Float, default=100.0)
    security_score = Column(Float, default=100.0)
    maintainability_score = Column(Float, default=100.0)
    architecture_score = Column(Float, default=100.0)
    devops_readiness_score = Column(Float, default=50.0)
    devops_readiness_details = Column(Text, default="{}")  # JSON with 8 pillars
    insights = Column(Text, default="{}")  # JSON architecture summary, components, recommendations
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="analyses")
    findings = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")
