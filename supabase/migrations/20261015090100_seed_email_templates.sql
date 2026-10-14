-- Default email templates. Editable at /admin/templates.
-- Variables use {{name}}; see src/domain/email/template.ts for the full list.

insert into public.email_templates (key, name, category, description, subject, body, is_system) values
(
  'inquiry_acknowledgement', 'Enquiry received (to prospect)', 'system',
  'Sent automatically when someone submits the Start a Project form.',
  'Thanks for your enquiry — {{reference}}',
  E'Hi {{first_name}},\n\nThanks for getting in touch about {{service}}. Your enquiry has arrived (reference {{reference}}) and I''ll reply personally, usually within one to two working days.\n\nIf anything changes in the meantime, just reply to this email.\n\nBest regards,\nRashed\n{{business_name}}',
  true
),
(
  'inquiry_admin_alert', 'New enquiry alert (to you)', 'system',
  'Sent to your notification email for every new or completed enquiry.',
  'New enquiry {{reference}}: {{service}}',
  E'{{lead_summary}}\n\nOpen in the dashboard: {{admin_lead_link}}',
  true
),
(
  'inquiry_resume_link', 'Finish your enquiry (resume link)', 'system',
  'Sent when a visitor saves an unfinished enquiry and asks for a link.',
  'Finish your enquiry with {{business_name}}',
  E'Hi {{first_name}},\n\nHere''s the link to pick up your enquiry where you left off:\n\n{{resume_link}}\n\nThe link works once and expires in 14 days. If you didn''t ask for this, you can ignore this email and the saved details will be deleted automatically.\n\nRashed\n{{business_name}}',
  true
),
(
  'initial_response', 'Initial response', 'lead',
  'First personal reply to a new enquiry.',
  'Re: your {{service}} enquiry ({{reference}})',
  E'Hi {{first_name}},\n\nThanks for your enquiry about {{service}}. I''ve read through the details and it sounds like something I can help with.\n\nThe best next step is a short call so I can understand your goals and answer any questions. You can choose a time here: {{consultation_link}}\n\nIf you''d rather continue by email, just reply with any extra details.\n\nBest regards,\nRashed\n{{business_name}}',
  false
),
(
  'follow_up', 'Follow-up', 'lead',
  'Gentle follow-up when you haven''t heard back.',
  'Following up on your {{service}} enquiry',
  E'Hi {{first_name}},\n\nI wanted to follow up on your enquiry about {{service}} ({{reference}}). Are you still looking for help with this?\n\nIf now isn''t the right time, no problem — just let me know and I''ll close the enquiry.\n\nBest regards,\nRashed\n{{business_name}}',
  false
),
(
  'request_details', 'Request more details', 'lead',
  'Ask for information needed to scope the project.',
  'A few questions about your {{service}} project',
  E'Hi {{first_name}},\n\nThanks again for your enquiry ({{reference}}). To give you an accurate proposal, could you tell me a little more about:\n\n- \n- \n- \n\nOnce I have these details I''ll send over a clear scope and quote.\n\nBest regards,\nRashed\n{{business_name}}',
  false
),
(
  'proposal_follow_up', 'Proposal follow-up', 'lead',
  'Check in after sending a proposal.',
  'Your proposal for {{service}}',
  E'Hi {{first_name}},\n\nI hope you''ve had a chance to look through the proposal for {{service}}. I''m happy to talk through any part of it or adjust the scope to suit your budget and timeline.\n\nIf you''d like to go ahead, just reply and I''ll send the next steps.\n\nBest regards,\nRashed\n{{business_name}}',
  false
)
on conflict (key) do nothing;
