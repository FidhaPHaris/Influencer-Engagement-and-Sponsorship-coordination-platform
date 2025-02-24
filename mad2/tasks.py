from celery import shared_task
from models import Campaign
import flask_excel as excel
from mail_service import send_email
from models import Influencer, AdRequest, Sponsor
from extensions import db
from datetime import datetime


#csv export

@shared_task()
def create_csv(ignore_result = False):
    campaigns = Campaign.query.with_entities(
            Campaign.name.label('Name'),
            Campaign.description.label('Description'),
            Campaign.start_date.label('Start Date'),
            Campaign.end_date.label('End Date'),
            Campaign.budget.label('Budget'),
            Campaign.visibility.label('Visibility'),
            Campaign.goals.label('Goals'),
        ).all()

    
    campaign_data = [
        [
            name,
            description,
            f"'{start_date.strftime('%m/%d/%Y')}" ,  
            f"'{end_date.strftime('%m/%d/%Y')}" ,
            budget,
            visibility,
            goals
        ]
        for name, description, start_date, end_date, budget, visibility, goals in campaigns
    ]

    
        
    campaign_data.insert(0, ["Name", "Description", "Start Date", "End Date", "Budget", "Visibility","Goals"])

    
    csv_output = excel.make_response_from_array(campaign_data, "csv")
    filename="campaign.csv"

    with open(filename, 'wb') as f:
        f.write(csv_output.data)

    return filename




# influencers who have pending ad requests

def get_influencers_with_pending_requests():
    
    influencers_with_pending_requests = db.session.query(Influencer).join(AdRequest).filter(
        AdRequest.influencer_id == Influencer.id,
        AdRequest.status == 'Pending'
    ).all()
    
    return influencers_with_pending_requests



# send daily reminders to influencers

@shared_task
def send_daily_reminders(ignore_result = True):
    influencers = get_influencers_with_pending_requests()
    
    for influencer in influencers:
        message = f"Hi {influencer.username}, you have pending ad requests. Please check and respond."
        
        
        send_email(influencer.email, "Reminder: Pending Ad Requests", message)
    return "OK"




# html report for monthly report

def render_report_to_html(sponsor, total_campaigns, total_ad_requests, total_budget_used, campaigns):
    
    campaign_details = ''.join(
        f"""
        <li>
            <strong>Campaign Name:</strong> {campaign.name} <br>
            <strong>Description:</strong> {campaign.description} <br>
            <strong>Goals:</strong> {campaign.goals} <br>
            <strong>Start Date:</strong> {campaign.start_date} <br>
            <strong>End Date:</strong> {campaign.end_date} <br>
            <strong>Budget:</strong> {campaign.budget} <br>
            <strong>Visibility:</strong> {campaign.visibility} <br>
            <strong>Ad Requests:</strong>
            <ul>
                {''.join(
                    f"""
                    <li>
                        <strong>Influencer:</strong> {ad_request.influencer.username} <br>
                        <strong>Status:</strong> {ad_request.status} <br>
                        <strong>Payment Amount:</strong> {ad_request.payment_amount} <br>
                        <strong>Requirements:</strong> {ad_request.requirements} <br>
                    </li><br>
                    """
                    for ad_request in campaign.ad_requests
                )}
            </ul>
        </li><br>
        """ 
        for campaign in campaigns
    )

    return f"""
    <html>
    <body>
        <h1>Monthly Activity Report for {sponsor.username}</h1>
        <p>Total Campaigns: {total_campaigns}</p>
        <p>Total Ad Requests: {total_ad_requests}</p>
        <p>Total Budget Used: {total_budget_used}</p>
        <h2>Campaign Details:</h2>
        <ul>
            {campaign_details}
        </ul>
    </body>
    </html>
    """


# monthly report to the sponsor

@shared_task
def generate_monthly_report(ignore_result = True):
    
    now = datetime.now()
    current_month = now.month
    current_year = now.year

    sponsors = db.session.query(Sponsor).all()  

    for sponsor in sponsors:
        
        campaigns = db.session.query(Campaign).filter(
            Campaign.sponsor_id == sponsor.id,  
            Campaign.start_date >= f'{current_year}-{current_month}-01',
            Campaign.start_date < f'{current_year}-{current_month + 1}-01' if current_month < 12 else f'{current_year + 1}-01-01'
        ).all()

        if not campaigns:
            continue  

        
        total_ad_requests = sum(len(campaign.ad_requests) for campaign in campaigns)
        total_budget_used = sum(campaign.budget for campaign in campaigns)

        
        html_content = render_report_to_html(
            sponsor=sponsor,
            total_campaigns=len(campaigns),
            total_ad_requests=total_ad_requests,
            total_budget_used=total_budget_used,
            campaigns=campaigns  
        )

        
        send_email(sponsor.email, "Monthly Activity Report", html_content)

    return "OK"