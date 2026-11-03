import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # QUALITY, SECURITY, MAINTAINABILITY, ARCHITECTURE
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    file_path = Column(String(500), nullable=False)
    line_number = Column(Integer, nullable=True, default=1)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)

    analysis = relationship("Analysis", back_populates="findings")
