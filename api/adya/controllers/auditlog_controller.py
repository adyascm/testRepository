from adya.db.models import AuditLog

def get_audit_log(auth_token):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    domain = db_session.query(Domain).filter(LoginUser.domain_id == Domain.domain_id). \
        filter(LoginUser.auth_token == auth_token).first()
    
    limit = 100

    audit_log_query = db_session.query(AuditLog).filter(AuditLog.domain_id == domain.domain_id).\
                        order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return audit_log_query
    
