namespace Nebula.API.Services
{
    public class NebulaConfiguration
    {
        public string DB_CONNECTION_STRING { get; set; }
        public string SITKA_EMAIL_REDIRECT { get; set; }
        public string WEB_URL { get; set; }
        public string LeadOrganizationEmail { get; set; }
        public string SendGridApiKey { get; set; }
        public string HostName { get; set; }
        public string AUTH0_AUTHORITY { get; set; }
        public string AUTH0_AUDIENCE { get; set; }
    }
}