
from flask import Flask
from extensions import db, bcrypt, jwt  
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models import Admin,User
from worker import celery_init_app
import flask_excel as excel
from tasks import send_daily_reminders, generate_monthly_report
from celery.schedules import crontab
from flask_caching import Cache




celery_app = None


def create_app():
 

    app = Flask(__name__)

    CORS(app)

    app.config['SECRET_KEY'] = '181407dce81e967cbab67810'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = '88d13c2752eccb4c5c941798'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  #1hr
    
    

    # cache config

    app.config["CACHE_DEFAULT_TIMEOUT"] = 300
    app.config["DEBUG"] = True
    app.config["CACHE_TYPE"] = "RedisCache"
    app.config["CACHE_REDIS_HOST"] = 'localhost'
    app.config["CACHE_REDIS_PORT"] = 6379


    # Initialize extensions
    
    cache = Cache(app)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    
    

    # Import routes and register them
    from routes import register_routes
    register_routes(app, cache)


    
    with app.app_context():
        db.create_all()
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = Admin(username='admin',email='admin@gmail.com', role='admin')
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
        
    return app




app = create_app()
celery_app = celery_init_app(app)
excel.init_excel(app)


@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    

    # daily remainder.
    sender.add_periodic_task(
        crontab(hour=22, minute=10),
        send_daily_reminders.s(),
        name='send daily reminders'
    )

    # monthly report.
    sender.add_periodic_task(
        crontab(hour=22, minute=10, day_of_month=27),  
        generate_monthly_report.s(),  
        name='send monthly activity report'
    )




if __name__ == '__main__':
    app.run(debug=True)
