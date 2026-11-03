import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    file_count = Column(Integer, default=0)
    line_count = Column(Integer, default=0)
    languages = Column(Text, default="{}")  # JSON string of language -> file count / lines
    dependencies = Column(Text, default="[]")  # JSON string of package lists
    extracted_path = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="repository")
