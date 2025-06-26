# GitHub Secrets Management with Terraform
# 
# Prerequisites:
# 1. Install Terraform: https://terraform.io/downloads
# 2. Install GitHub provider: terraform init
# 3. Set GITHUB_TOKEN environment variable

terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

# Configure the GitHub Provider
provider "github" {
  token = var.github_token
}

# Variables for repository configuration
variable "github_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

variable "repository_name" {
  description = "GitHub repository name"
  type        = string
  default     = "k-fin"
}

variable "repository_owner" {
  description = "GitHub repository owner"
  type        = string
}

# Variables for secrets
variable "secrets" {
  description = "Map of secrets to set in the repository"
  type        = map(string)
  sensitive   = true
  default     = {}
}

# Repository secrets
resource "github_actions_secret" "secrets" {
  for_each = var.secrets

  repository      = var.repository_name
  secret_name     = each.key
  plaintext_value = each.value
}

# Output the names of created secrets
output "created_secrets" {
  description = "List of created secret names"
  value       = keys(github_actions_secret.secrets)
}

# Example: Create specific secrets with default values
resource "github_actions_secret" "codecov_token" {
  repository      = var.repository_name
  secret_name     = "CODECOV_TOKEN"
  plaintext_value = var.codecov_token
}

resource "github_actions_secret" "vercel_token" {
  repository      = var.repository_name
  secret_name     = "VERCEL_TOKEN"
  plaintext_value = var.vercel_token
}

resource "github_actions_secret" "vercel_org_id" {
  repository      = var.repository_name
  secret_name     = "VERCEL_ORG_ID"
  plaintext_value = var.vercel_org_id
}

resource "github_actions_secret" "vercel_project_id" {
  repository      = var.repository_name
  secret_name     = "VERCEL_PROJECT_ID"
  plaintext_value = var.vercel_project_id
}

# Secret variables (define in terraform.tfvars)
variable "codecov_token" {
  description = "Codecov token for coverage reports"
  type        = string
  sensitive   = true
  default     = ""
}

variable "vercel_token" {
  description = "Vercel deployment token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "vercel_org_id" {
  description = "Vercel organization ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "vercel_project_id" {
  description = "Vercel project ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  sensitive   = true
  default     = ""
}

variable "database_url" {
  description = "Production database URL"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  default     = ""
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

# Additional secrets
resource "github_actions_secret" "additional_secrets" {
  for_each = {
    "SLACK_WEBHOOK_URL"             = var.slack_webhook_url
    "DATABASE_URL"                  = var.database_url
    "NEXT_PUBLIC_SUPABASE_URL"      = var.supabase_url
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = var.supabase_anon_key
    "GOOGLE_CLIENT_ID"              = var.google_client_id
    "GOOGLE_CLIENT_SECRET"          = var.google_client_secret
  }

  repository      = var.repository_name
  secret_name     = each.key
  plaintext_value = each.value

  # Only create if value is not empty
  count = each.value != "" ? 1 : 0
} 