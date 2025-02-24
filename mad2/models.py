from extensions import db, bcrypt

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)  
    role = db.Column(db.String(10), nullable=False)  # 'admin', 'sponsor', 'influencer'
    flagged = db.Column(db.Boolean, default=False)

    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': role
    }

    def set_password(self, password):
       
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        
        return bcrypt.check_password_hash(self.password, password)


class Admin(User):
    __tablename__ = 'admin'
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'admin',
    }


class Sponsor(User):
    __tablename__ = 'sponsor'
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    company_name = db.Column(db.String(100))
    industry = db.Column(db.String(100))
    budget = db.Column(db.Integer)
    approved = db.Column(db.Boolean, default=False)

    __mapper_args__ = {
        'polymorphic_identity': 'sponsor',
    }



class Influencer(User):
    __tablename__ = 'influencer'
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    category = db.Column(db.String(100))
    niche = db.Column(db.String(100))
    reach = db.Column(db.String(100))

    __mapper_args__ = {
        'polymorphic_identity': 'influencer',
    }

    


class Campaign(db.Model):
    __tablename__ = 'campaign'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    budget = db.Column(db.Integer, nullable=False)
    visibility = db.Column(db.String(10), nullable=False)  # 'public' or 'private'
    goals = db.Column(db.Text, nullable=False)
    flagged = db.Column(db.Boolean, default=False)
    sponsor_id = db.Column(db.Integer, db.ForeignKey('sponsor.id'), nullable=False)  
    sponsor = db.relationship('Sponsor', backref='campaigns')


class AdRequest(db.Model):
    __tablename__ = 'ad_request'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    campaign = db.relationship('Campaign', backref='ad_requests')
    influencer_id = db.Column(db.Integer, db.ForeignKey('influencer.id'), nullable=False)
    influencer = db.relationship('Influencer', backref='ad_requests')
    messages = db.Column(db.Text)
    requirements = db.Column(db.Text, nullable=False)
    payment_amount = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(10), nullable=False, default='Pending')



class CampaignApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    influencer_id = db.Column(db.Integer, db.ForeignKey('influencer.id'), nullable=False)
    message = db.Column(db.String, nullable=True)
    status = db.Column(db.String, default='Pending')  # 'Pending', 'Accepted', 'Rejected'

    
    campaign = db.relationship('Campaign', backref='applications')
    influencer = db.relationship('Influencer', backref='applications')

    def __repr__(self):
        return f"<CampaignApplication {self.id} from Influencer {self.influencer_id} for Campaign {self.campaign_id}>"
    



class FlaggedEntity(db.Model):
    __tablename__ = 'flagged_entities'

    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(50), nullable=False)  # 'user' or 'campaign'
    entity_id = db.Column(db.Integer, nullable=False)  
    reason = db.Column(db.String(255), nullable=False)  
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=True)

    def __repr__(self):
        return f"<FlaggedEntity {self.entity_type} {self.entity_id} - {self.reason}>"
    





