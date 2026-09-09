from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import json
from app.core.database import Base

student_class = Table('student_class', Base.metadata,
    Column('student_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('class_id', Integer, ForeignKey('class_rooms.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='student') # admin, teacher, student
    roll_number = Column(String(50), unique=True, index=True, nullable=True)
    
    face_encoding = Column(Text, nullable=True) 
    qr_code_data = Column(String(255), unique=True, nullable=True)

    classes = relationship('ClassRoom', secondary=student_class, back_populates='students')
    taught_subjects = relationship('Subject', back_populates='teacher')

    def set_face_encoding(self, encoding_list):
        self.face_encoding = json.dumps(encoding_list)

    def get_face_encoding(self):
        if self.face_encoding:
            return json.loads(self.face_encoding)
        return None

class ClassRoom(Base):
    __tablename__ = 'class_rooms'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    subjects = relationship('Subject', back_populates='class_room')
    students = relationship('User', secondary=student_class, back_populates='classes')

class Subject(Base):
    __tablename__ = 'subjects'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    class_id = Column(Integer, ForeignKey('class_rooms.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    class_room = relationship('ClassRoom', back_populates='subjects')
    teacher = relationship('User', back_populates='taught_subjects')
    sessions = relationship('AttendanceSession', back_populates='subject')

class AttendanceSession(Base):
    __tablename__ = 'attendance_sessions'
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=False, default=datetime.utcnow().date)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default='active')
    
    subject = relationship('Subject', back_populates='sessions')
    records = relationship('AttendanceRecord', back_populates='session')

class AttendanceRecord(Base):
    __tablename__ = 'attendance_records'
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('attendance_sessions.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    method = Column(String(20), nullable=False) 
    status = Column(String(20), nullable=False, default='present')
    
    session = relationship('AttendanceSession', back_populates='records')
