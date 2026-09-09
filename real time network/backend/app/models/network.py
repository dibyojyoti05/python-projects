from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Uuid
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base

class NetworkInterface(Base):
    __tablename__ = "network_interfaces"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False, index=True)
    is_up = Column(Boolean, default=True)
    mac_address = Column(String, nullable=True)
    ipv4_address = Column(String, nullable=True)
    ipv6_address = Column(String, nullable=True)
    speed_mbps = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    metrics = relationship("NetworkMetric", back_populates="interface", cascade="all, delete-orphan")

class NetworkMetric(Base):
    __tablename__ = "network_metrics"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    interface_id = Column(Uuid(as_uuid=True), ForeignKey("network_interfaces.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Latency/Connectivity
    latency_ms = Column(Float, nullable=True)
    packet_loss_percent = Column(Float, nullable=True)
    is_online = Column(Boolean, default=True)
    
    # Traffic
    bytes_sent = Column(Float, default=0.0)
    bytes_received = Column(Float, default=0.0)
    packets_sent = Column(Integer, default=0)
    packets_received = Column(Integer, default=0)
    
    # Errors
    errors_in = Column(Integer, default=0)
    errors_out = Column(Integer, default=0)
    drops_in = Column(Integer, default=0)
    drops_out = Column(Integer, default=0)

    interface = relationship("NetworkInterface", back_populates="metrics")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    mac_address = Column(String, unique=True, index=True, nullable=True)
    ip_address = Column(String, index=True, nullable=True)
    hostname = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    is_online = Column(Boolean, default=True)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(String, nullable=False, index=True)  # latency, connectivity, device_offline, etc.
    severity = Column(String, nullable=False)  # INFO, WARNING, CRITICAL
    message = Column(String, nullable=False)
    metric_value = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, RESOLVED
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    incident_id = Column(Uuid(as_uuid=True), ForeignKey("incidents.id"), nullable=True, index=True)
    incident = relationship("Incident", back_populates="alerts")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    status = Column(String, default="ONGOING") # ONGOING, RESOLVED
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    impact = Column(String, nullable=True)
    
    alerts = relationship("Alert", back_populates="incident")
