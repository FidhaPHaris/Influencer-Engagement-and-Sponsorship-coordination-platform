from flask import request, jsonify, render_template, send_file
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db, bcrypt
from models import User, Admin, Sponsor, Influencer, Campaign, AdRequest, CampaignApplication, FlaggedEntity
import logging
import flask_excel as excel
from celery.result import AsyncResult
from datetime import datetime
from tasks import create_csv


def register_routes(app, cache):



    #celery
    @app.route('/downloadcsv')
    def download_csv():
        task = create_csv.delay()
        return jsonify({"task-id": task.id})



    @app.route('/getcsv/<task_id>')
    def get_csv(task_id):
        res = AsyncResult(task_id)
        if res.ready():
            filename = res.result
            return send_file(filename, as_attachment=True)
        else:
            return jsonify({"message": "Task Pending"}), 404



    
    @app.route('/')
    def home():
        return render_template('index.html')
    
    
    
    @app.route('/current_user', methods=['GET'])
    @jwt_required()
    def get_current_user():
        current_user = get_jwt_identity()
    
        user = User.query.filter_by(username=current_user['username']).first()
        if user:
            return jsonify({'role': user.role})
        return jsonify({'msg': 'User not found'}), 404



    # user register

    @app.route('/register', methods=['POST'])
    def register():
        try:
            data = request.json
            username = data['username']
            email = data['email']
            password = data['password']
            role = data['role']

            if role not in ['admin', 'sponsor', 'influencer']:
                return jsonify({"msg": "Invalid role"}), 400

            if User.query.filter_by(username=username).first():
                return jsonify({"msg": "Username already exists"}), 400

            
            if role == 'sponsor':
                user = Sponsor(username=username, email=email, company_name=data.get('company_name'), industry=data.get('industry'), budget=data.get('budget'),approved=False)
            else:
                user = Influencer(username=username, email=email, category=data.get('category'), niche=data.get('niche'), reach=data.get('reach'))

            user.set_password(password)
            db.session.add(user)
            db.session.commit()

            

            return jsonify({"msg": "User registered successfully"}), 201

        except Exception as e:
            print(f"Error: {e}")  
            return jsonify({"msg": "Internal server error"}), 500



    # user login

    @app.route('/login', methods=['POST'])
    def login():
        data = request.json
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        if user:
            if user.flagged:
                return jsonify({"msg": "Your account has been flagged. Please contact support."}), 403
            
            if user.role == 'sponsor' and not user.approved:
                return jsonify({"msg": "Your account is pending approval from an admin."}), 403

            if user.check_password(password):
                access_token = create_access_token(identity={'id': user.id, 'username': user.username, 'role': user.role})
                cache.delete('campaigns')
                return jsonify(access_token=access_token), 200


        return jsonify({"msg": "Bad username or password"}), 401




    # sponsor create campaign

    @app.route('/campaign', methods=['POST'])
    @jwt_required()
    def create_campaign():
        current_user = get_jwt_identity()
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

        data = request.json
        new_campaign = Campaign(
            name=data['name'],
            description=data['description'],
            start_date= datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            budget=data['budget'],
            visibility=data['visibility'],
            goals=data['goals'],
            sponsor_id=current_user['id']
        )
        db.session.add(new_campaign)
        db.session.commit()
        cache.delete('campaigns')
        return jsonify({"msg": "Campaign created successfully"}), 201
    


    # sponsor view all campaign

    @app.route('/view_campaign', methods=['GET'])
    @cache.cached(timeout=300, key_prefix='campaigns')
    @jwt_required()
    def get_campaigns():
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

    
        campaigns = Campaign.query.filter_by(sponsor_id=current_user['id']).filter_by(flagged=False).all()
        if not campaigns:
            return jsonify({"msg": "No campaigns found"}), 404

    
        campaigns_data = [{
            'id': campaign.id,
            'name': campaign.name,
            'description': campaign.description,
            'start_date': campaign.start_date.isoformat(),
            'end_date': campaign.end_date.isoformat(),
            'budget': campaign.budget,
            'visibility': campaign.visibility,
            'goals': campaign.goals,
        } for campaign in campaigns]

        return jsonify(campaigns_data), 200

    


    # sponsor edit campaign

    @app.route('/edit_campaign/<int:campaign_id>', methods=['PUT'])
    @jwt_required()
    def update_campaign(campaign_id):
        current_user = get_jwt_identity()
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

        campaign = Campaign.query.filter_by(id=campaign_id, sponsor_id=current_user['id']).first()
        if not campaign:
            return jsonify({"msg": "Campaign not found"}), 404

        data = request.json
        start_date_str = data.get('start_date', campaign.start_date)
        end_date_str = data.get('end_date', campaign.end_date)

        
        campaign.name = data.get('name', campaign.name)
        campaign.description = data.get('description', campaign.description)
        campaign.start_date = datetime.fromisoformat(start_date_str).date()
        campaign.end_date = datetime.fromisoformat(end_date_str).date()
        campaign.budget = data.get('budget', campaign.budget)
        campaign.visibility = data.get('visibility', campaign.visibility)
        campaign.goals = data.get('goals', campaign.goals)
        db.session.commit()
        cache.delete('campaigns')
        return jsonify({"msg": "Campaign updated successfully"}), 200
    



    # sponsor view particular campaign details

    @app.route('/view_campaign_details/<int:id>', methods=['GET'])
    @jwt_required()
    def get_campaign(id):
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

    
        campaign = Campaign.query.filter_by(id=id, sponsor_id=current_user['id']).first()
        if not campaign:
            return jsonify({"msg": "Campaign not found or unauthorized"}), 404

    
        influencers = Influencer.query.all()
        influencer_list = [{'id': influencer.id, 'username': influencer.username} for influencer in influencers]

        
        ad_requests = AdRequest.query.filter_by(campaign_id=campaign.id).all()
        ad_request_list = [{
            'id': ad_request.id,
            'influencer': ad_request.influencer.username,
            'requirements': ad_request.requirements,
            'payment_amount': ad_request.payment_amount,
            'messages': ad_request.messages,
            'status': ad_request.status
        } for ad_request in ad_requests]

    
        campaign_data = {
            'id': campaign.id,
            'name': campaign.name,
            'description': campaign.description,
            'start_date': campaign.start_date.isoformat(),
            'end_date': campaign.end_date.isoformat(),
            'budget': campaign.budget,
            'visibility': campaign.visibility,
            'goals': campaign.goals,
            'influencers': influencer_list,
            'ad_requests': ad_request_list
        }

        return jsonify(campaign_data), 200

    


    # delete campaign

    @app.route('/delete_campaign/<int:campaign_id>', methods=['DELETE'])
    @jwt_required()
    def delete_campaign(campaign_id):
        current_user = get_jwt_identity()
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

        campaign = Campaign.query.filter_by(id=campaign_id, sponsor_id=current_user['id']).first()
        if not campaign:
            return jsonify({"msg": "Campaign not found"}), 404

        db.session.delete(campaign)
        db.session.commit()
        cache.delete('campaigns')
        return jsonify({"msg": "Campaign deleted successfully"}), 200
    


    # sponsor create ad request for the particular campaign

    @app.route('/ad_request', methods=['POST'])
    @jwt_required()
    def create_ad_request():
        current_user = get_jwt_identity()
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

        data = request.json
        new_ad_request = AdRequest(
            campaign_id=data['campaign_id'],
            influencer_id=data['influencer_id'],
            messages=data.get('messages', ''),
            requirements=data['requirements'],
            payment_amount=data['payment_amount'],
            status='Pending'
        )
        db.session.add(new_ad_request)
        db.session.commit()
        return jsonify({"msg": "Ad request created successfully"}), 201
    


    # sponsor edit ad request

    @app.route('/edit_ad_request/<int:ad_request_id>', methods=['PUT'])
    @jwt_required()
    def update_ad_request(ad_request_id):
        current_user = get_jwt_identity()
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

        ad_request = AdRequest.query.filter_by(id=ad_request_id).first()
        if not ad_request:
            return jsonify({"msg": "Ad request not found"}), 404

        data = request.json
        ad_request.influencer_id = data.get('influencer_id', ad_request.influencer_id)
        ad_request.requirements = data.get('requirements', ad_request.requirements)
        ad_request.payment_amount = data.get('payment_amount', ad_request.payment_amount)
        ad_request.status = data.get('status', ad_request.status)
        ad_request.messages = data.get('messages', ad_request.messages)

        db.session.commit()
        return jsonify({"msg": "Ad request updated successfully"}), 200
    


    # sponsor delete ad request

    @app.route('/delete_ad_request/<int:ad_request_id>', methods=['DELETE'])
    @jwt_required()
    def delete_ad_request(ad_request_id):
        current_user = get_jwt_identity()
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

        ad_request = AdRequest.query.filter_by(id=ad_request_id).first()
        if not ad_request:
            return jsonify({"msg": "Ad request not found"}), 404

        db.session.delete(ad_request)
        db.session.commit()
        return jsonify({"msg": "Ad request deleted successfully"}), 200



    # sponsor search influencers

    @app.route('/search_influencers', methods=['GET'])
    @jwt_required()
    def search_influencers():
        current_user = get_jwt_identity()
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

        niche = request.args.get('niche')
        reach = request.args.get('reach')

        query = Influencer.query
        if niche:
            query = query.filter(Influencer.niche.ilike(f'%{niche}%'))
        if reach:
            query = query.filter(Influencer.reach >= int(reach))

        influencers = query.all()
        influencer_list = [{'id': influencer.id, 'username': influencer.username, 'category' : influencer.category, 'niche': influencer.niche, 'reach': influencer.reach,} for influencer in influencers]
        return jsonify(influencer_list), 200




    # sponsor view request for campaigns from influencers

    @app.route('/sponsor/campaign-applications', methods=['GET'])
    @jwt_required()
    def get_campaign_applications_for_sponsor():
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

    # Get all campaigns owned by the sponsor
        sponsor_campaigns = Campaign.query.filter_by(sponsor_id=current_user['id']).all()

        if not sponsor_campaigns:
            return jsonify({"msg": "No campaigns found"}), 404

        campaign_ids = [campaign.id for campaign in sponsor_campaigns]

    # Get all applications for these campaigns
        applications = CampaignApplication.query.filter(CampaignApplication.campaign_id.in_(campaign_ids)).all()

    
        application_data = []
        for application in applications:
            influencer = Influencer.query.get(application.influencer_id)
            campaign = Campaign.query.get(application.campaign_id)
            application_data.append({
                'application_id': application.id,
                'campaign_name': campaign.name,
                'influencer_name': influencer.username,
                'message': application.message,
                'status': application.status,
            })

        return jsonify(application_data), 200
    


    # sponsor respond to request from influencers

    @app.route('/sponsor/campaign_application/<int:application_id>/respond', methods=['POST'])
    @jwt_required()
    def respond_campaign_application(application_id):
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'sponsor':
            return jsonify({"msg": "Unauthorized"}), 403

    
        application = CampaignApplication.query.get(application_id)

        if not application:
            return jsonify({"msg": "Application not found"}), 404

    # Ensure the application belongs to a campaign owned by the sponsor
        campaign = Campaign.query.get(application.campaign_id)
        if campaign.sponsor_id != current_user['id']:
            return jsonify({"msg": "Unauthorized to respond to this application"}), 403

        data = request.json
        action = data.get('action')

        if action == 'accept':
            application.status = 'Accepted'
        elif action == 'reject':
            application.status = 'Rejected'
        else:
            return jsonify({"msg": "Invalid action"}), 400

        db.session.commit()

        return jsonify({"msg": f"Application {action}ed successfully"}), 200




    # influencer view ad request

    @app.route('/influencer/ad_requests', methods=['GET'])
    @jwt_required()
    def get_influencer_ad_requests():
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'influencer':
            return jsonify({"msg": "Unauthorized"}), 403

        influencer_id = current_user['id']

    
        ad_requests = AdRequest.query.filter_by(influencer_id=influencer_id).all()

        ad_request_list = []
        for ad_request in ad_requests:
            
            campaign = Campaign.query.get(ad_request.campaign_id)
            sponsor = campaign.sponsor  

            ad_request_list.append({
                'id': ad_request.id,
                'campaign_id': campaign.id,
                'campaign_name': campaign.name,
                'sponsor_name': sponsor.username,  
                'messages': ad_request.messages,
                'requirements': ad_request.requirements,
                'payment_amount': ad_request.payment_amount,
                'status': ad_request.status,
                'visibility': campaign.visibility  
            })

        return jsonify(ad_request_list), 200
    


    # influencer respond to ad request

    @app.route('/influencer/ad_request/<int:ad_request_id>/respond', methods=['POST'])
    @jwt_required()
    def respond_ad_request(ad_request_id):
        current_user = get_jwt_identity()

        if current_user['role'] != 'influencer':
            return jsonify({"msg": "Unauthorized"}), 403

        ad_request = AdRequest.query.filter_by(id=ad_request_id, influencer_id=current_user['id']).first()

        if not ad_request:
            return jsonify({"msg": "Ad request not found"}), 404

        data = request.json
        action = data.get('action')
    
        if action == 'accept':
            ad_request.status = 'Accepted'
        elif action == 'reject':
            ad_request.status = 'Rejected'
        elif action == 'negotiate':
            ad_request.payment_amount = data.get('payment_amount', ad_request.payment_amount)
            ad_request.status = 'Negotiated'
        else:
            return jsonify({"msg": "Invalid action"}), 400

        db.session.commit()

        return jsonify({"msg": f"Ad request {action}ed successfully"}), 200
    


    # influencer search for public campaigns

    @app.route('/influencer/search_campaigns', methods=['GET'])
    @jwt_required()
    def search_public_campaigns():
        current_user = get_jwt_identity()

        if current_user['role'] != 'influencer':
            return jsonify({"msg": "Unauthorized"}), 403


        budget = request.args.get('budget')

        query = Campaign.query.filter_by(visibility='public').filter_by(flagged=False)
    
        
        if budget:
            query = query.filter(Campaign.budget <= budget)
    
        campaigns = query.all()

        campaign_list = []
        for campaign in campaigns:
            campaign_list.append({
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'budget': campaign.budget,
                'start_date': campaign.start_date,
                'end_date': campaign.end_date,
                'visibility': campaign.visibility,
                'goals': campaign.goals
            })

        return jsonify(campaign_list), 200
    


    # influencer apply for the campaign

    @app.route('/influencer/apply_campaign/<int:campaign_id>', methods=['POST'])
    @jwt_required()
    def apply_campaign(campaign_id):
        current_user = get_jwt_identity()

        if current_user['role'] != 'influencer':
            return jsonify({"msg": "Unauthorized"}), 403

        campaign = Campaign.query.get(campaign_id)
        if not campaign:
            return jsonify({"msg": "Campaign not found"}), 404

        data = request.json
        message = data.get('message')

    # Check if the influencer has already applied
        existing_application = CampaignApplication.query.filter_by(
            campaign_id=campaign_id, influencer_id=current_user['id']).first()
    
        if existing_application:
            return jsonify({"msg": "You have already applied to this campaign."}), 400

        new_application = CampaignApplication(
            campaign_id=campaign_id,
            influencer_id=current_user['id'],
            message=message,
            status='Pending'
        )

        db.session.add(new_application)
        db.session.commit()

        return jsonify({"msg": "Application submitted successfully."}), 200
    


    # influencer view campaign applications

    @app.route('/influencer/campaign_applications', methods=['GET'])
    @jwt_required()
    def get_campaign_applications():
        current_user = get_jwt_identity()

        if current_user['role'] != 'influencer':
            return jsonify({"msg": "Unauthorized"}), 403

        influencer_id = current_user['id']

    
        campaign_applications = CampaignApplication.query.filter_by(influencer_id=influencer_id).all()

        application_list = []
        for application in campaign_applications:
            campaign = Campaign.query.get(application.campaign_id)
            sponsor = campaign.sponsor  

            application_list.append({
                'id': application.id,
                'campaign_name': campaign.name,
                'sponsor_name': sponsor.username,  
                'message': application.message,
                'status': application.status
            })

        return jsonify(application_list), 200
    

    # influencer delete campaign application

    @app.route('/influencer/campaign_application/<int:application_id>', methods=['DELETE'])
    @jwt_required()
    def delete_campaign_application(application_id):
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'influencer':
            return jsonify({"msg": "Unauthorized"}), 403

    
        application = CampaignApplication.query.filter_by(id=application_id, influencer_id=current_user['id']).first()

        if not application:
            return jsonify({"msg": "Campaign application not found"}), 404

    
        db.session.delete(application)
        db.session.commit()

        return jsonify({"msg": "Campaign application deleted successfully"}), 200
    


    # influencer update profile

    @app.route('/influencer/profile', methods=['GET', 'PUT'])
    @jwt_required()
    def influencer_profile():
        current_user = get_jwt_identity()

        if current_user['role'] != 'influencer':
            return jsonify({"msg": "Unauthorized"}), 403

        influencer = Influencer.query.get(current_user['id'])

        if request.method == 'GET':
            return jsonify({
                'id': influencer.id,
                'username': influencer.username,
                'email': influencer.email,
                'category': influencer.category,
                'niche': influencer.niche,
                'reach': influencer.reach
            }), 200

        if request.method == 'PUT':
            data = request.json

            influencer.username = data.get('username', influencer.username)
            influencer.email = data.get('email', influencer.email)
            influencer.category = data.get('category', influencer.category)
            influencer.niche = data.get('niche', influencer.niche)
            influencer.reach = data.get('reach', influencer.reach)

            

            db.session.commit()

            return jsonify({
                'id': influencer.id,
                'username': influencer.username,
                'email': influencer.email,
                'category': influencer.category,
                'niche': influencer.niche,
                'reach': influencer.reach
            }), 200



    # admin dashboard

    @app.route('/admin/dashboard_stats', methods=['GET'])
    @jwt_required()
    def admin_dashboard_stats():
        current_user = get_jwt_identity()
    
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403
        

        total_sponsors = User.query.filter_by(role='sponsor').count()
        total_influencers = User.query.filter_by(role='influencer').count()
        total_users = User.query.count()
        public_campaigns = Campaign.query.filter_by(visibility='public').count()
        private_campaigns = Campaign.query.filter_by(visibility='private').count()
        ad_requests = AdRequest.query.count()
        flagged_users_count = FlaggedEntity.query.filter(FlaggedEntity.entity_type == 'user').count()
        flagged_campaigns_count = FlaggedEntity.query.filter(FlaggedEntity.entity_type == 'campaign').count()  
    
        return jsonify({
            "total_users": total_users,
            "total_sponsors": total_sponsors,
            "total_influencers": total_influencers,
            "public_campaigns": public_campaigns,
            "ad_requests": ad_requests,
            "private_campaigns": private_campaigns,
            "flagged_users_count": flagged_users_count,
            "flagged_campaigns_count": flagged_campaigns_count,
        }), 200



    # admin view sponsors

    @app.route('/admin/sponsors', methods=['GET'])
    @jwt_required()
    def get_all_sponsors():
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        sponsors = Sponsor.query.all()
        sponsor_data = []

        for sponsor in sponsors:
        # Check if the sponsor is flagged by querying the FlaggedEntity table
            is_flagged = FlaggedEntity.query.filter_by(entity_type='user', entity_id=sponsor.id).first() is not None

            sponsor_data.append({
                'id': sponsor.id,
                'username': sponsor.username,
                'email': sponsor.email,
                'company_name': sponsor.company_name,
                'industry': sponsor.industry,
                'budget': sponsor.budget,
                'flagged': is_flagged  
            })

        return jsonify(sponsor_data), 200
    


    # admin view influencers

    @app.route('/admin/influencers', methods=['GET'])
    @jwt_required()
    def get_all_influencers():
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        influencers = Influencer.query.all()
        influencer_data = []

        for influencer in influencers:
        # Check if the influencer is flagged by querying the FlaggedEntity table
            is_flagged = FlaggedEntity.query.filter_by(entity_type='user', entity_id=influencer.id).first() is not None

            influencer_data.append({
                'id': influencer.id,
                'username': influencer.username,
                'email': influencer.email,
                'category': influencer.category,
                'niche': influencer.niche,
                'reach': influencer.reach,
                'flagged': is_flagged  
            })


        return jsonify(influencer_data), 200
    


    # admin Route to flag a user

    @app.route('/admin/flag_user/<int:user_id>', methods=['POST'])
    @jwt_required()
    def flag_user(user_id):
        current_user = get_jwt_identity()

        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404

    # Check if the user is already flagged
        existing_flag = FlaggedEntity.query.filter_by(entity_type='user', entity_id=user.id).first()
        if existing_flag:
            return jsonify({"msg": "User is already flagged."}), 400

    # Add a new entry to the FlaggedEntity table
        flagged_entity = FlaggedEntity(entity_type='user', entity_id=user.id, reason='Inappropriate behavior', user_id=user.id)
        db.session.add(flagged_entity)
        user.flagged = True
        db.session.commit()

        return jsonify({"msg": "User flagged successfully."}), 200



    # admin Route to unflag a user (delete the entry)

    @app.route('/admin/unflag_user/<int:user_id>', methods=['POST'])
    @jwt_required()
    def unflag_user(user_id):
        current_user = get_jwt_identity()

        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

    # Find the flagged entry for this user
        flagged_entity = FlaggedEntity.query.filter_by(user_id=user_id).first()

        if not flagged_entity:
            return jsonify({"msg": "No flagged entry found for this user."}), 404
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "User not found."}), 404

    
        db.session.delete(flagged_entity)
        user.flagged = False
        db.session.commit()

        return jsonify({"msg": "User unflagged successfully."}), 200
    

    # admin view campaigns

    @app.route('/admin/campaigns', methods=['GET'])
    @jwt_required()
    def get_all_campaigns():
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        campaigns = Campaign.query.all()
        campaign_data = [{
            'id': campaign.id,
            'name': campaign.name,
            'description': campaign.description,
            'start_date': campaign.start_date.strftime('%d/%m/%Y'),
            'end_date': campaign.end_date.strftime('%d/%m/%Y'),
            'budget': campaign.budget,
            'visibility': campaign.visibility,
            'goals': campaign.goals,
            'flagged': campaign.flagged,
            'sponsor_name': campaign.sponsor.username,
        } for campaign in campaigns]

        return jsonify(campaign_data), 200
    

    # admin flag campaign

    @app.route('/admin/flag_campaign/<int:campaign_id>', methods=['POST'])
    @jwt_required()
    def flag_campaign(campaign_id):
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

    
        campaign = Campaign.query.get(campaign_id)
        if not campaign:
            return jsonify({"msg": "Campaign not found"}), 404

    # Check if the campaign is already flagged
        existing_flag = FlaggedEntity.query.filter_by(entity_type='campaign', entity_id=campaign.id).first()
        if existing_flag:
            return jsonify({"msg": "Campaign is already flagged."}), 400

    # Create and add the flagged entity
        flagged_entity = FlaggedEntity(entity_type='campaign', entity_id=campaign.id, reason='Fake',campaign_id=campaign.id)
        db.session.add(flagged_entity)

    
        campaign.flagged = True
        db.session.commit()  
        cache.delete('campaigns')

        return jsonify({"msg": "Campaign flagged successfully."}), 200

    
    
    # admin unflag campaign

    @app.route('/admin/unflag_campaign/<int:campaign_id>', methods=['POST'])
    @jwt_required()
    def unflag_campaign(campaign_id):
        current_user = get_jwt_identity()

        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403
        
        flagged_entity = FlaggedEntity.query.filter_by(campaign_id=campaign_id).first()

        if not flagged_entity:
            return jsonify({"msg": "No flagged entry found for this campaign."}), 404

        campaign = Campaign.query.get(campaign_id)
        if not campaign:
            return jsonify({"msg": "Campaign not found"}), 404

    
        db.session.delete(flagged_entity)
        campaign.flagged = False
        db.session.commit()
        cache.delete('campaigns')

        return jsonify({"msg": "Campaign unflagged successfully."}), 200
    


    # admin view ad request

    @app.route('/admin/ad_requests', methods=['GET'])
    @jwt_required()
    def get_all_ad_requests():
        current_user = get_jwt_identity()

        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        ad_requests = AdRequest.query.all()
        ad_request_data = [{
            'id': ad_request.id,
            'campaign_id': ad_request.campaign_id,
            'influencer_id': ad_request.influencer_id,
            'messages': ad_request.messages,
            'requirements': ad_request.requirements,
            'payment_amount': ad_request.payment_amount,
            'status': ad_request.status,
            'campaign_name': ad_request.campaign.name,  
            'influencer_name': ad_request.influencer.username  
        } for ad_request in ad_requests]

        return jsonify(ad_request_data), 200
    



    # admin view request from influencers

    @app.route('/admin/campaign_applications', methods=['GET'])
    @jwt_required()
    def get_campaign_applications_admin():
        current_user = get_jwt_identity()

    
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

    
        applications = CampaignApplication.query.all()

    
        applications_data = [{
            'id': application.id,
            'campaign_id': application.campaign_id,
            'campaign_name': application.campaign.name,
            'influencer_id': application.influencer_id,
            'influencer_name': application.influencer.username,
            'message': application.message,
            'status': application.status
        }for application in applications]

        return jsonify(applications_data), 200



    # admin view pending sponsors

    @app.route('/admin/pending_sponsors', methods=['GET'])
    @jwt_required()
    def get_pending_sponsors():
        current_user = get_jwt_identity()
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        pending_sponsors = Sponsor.query.filter_by(approved=False).all()
        sponsors_data = [{
            'id': sponsor.id,
            'username': sponsor.username,
            'email': sponsor.email,
            'company_name': sponsor.company_name,
            'industry': sponsor.industry,
            'budget': sponsor.budget
        } for sponsor in pending_sponsors]

        return jsonify(sponsors_data), 200
    


    # admin approve pending sponsor

    @app.route('/admin/approve_sponsor/<int:sponsor_id>', methods=['POST'])
    @jwt_required()
    def approve_sponsor(sponsor_id):
        current_user = get_jwt_identity()
        if current_user['role'] != 'admin':
            return jsonify({"msg": "Unauthorized"}), 403

        sponsor = Sponsor.query.get(sponsor_id)
        if not sponsor:
            return jsonify({"msg": "Sponsor not found"}), 404

        sponsor.approved = True
        db.session.commit()
        cache.delete('campaigns')

        return jsonify({"msg": "Sponsor approved successfully"}), 200









    @app.route('/protected', methods=['GET'])
    @jwt_required()
    def protected():
        current_user = get_jwt_identity()
        return jsonify(logged_in_as=current_user), 200



    


