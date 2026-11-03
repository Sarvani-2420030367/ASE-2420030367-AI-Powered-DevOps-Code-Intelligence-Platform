import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    message = Column(Text, nullable=False)
    sources = Column(Text, default="[]")  # JSON string of source references
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")
