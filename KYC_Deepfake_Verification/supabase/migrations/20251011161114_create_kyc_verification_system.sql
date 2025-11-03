/*
  # KYC Verification System Database Schema

  ## Overview
  Complete database schema for an Indian government-style KYC Aadhaar verification system
  with user registration and document upload capabilities.

  ## New Tables
  
  ### 1. `profiles`
  User profile information extending auth.users
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's complete name
  - `email` (text) - Email address
  - `phone` (text) - Contact number
  - `date_of_birth` (date) - Date of birth
  - `created_at` (timestamp) - Account creation time
  - `updated_at` (timestamp) - Last update time

  ### 2. `kyc_verifications`
  KYC verification requests and status
  - `id` (uuid, primary key) - Unique verification ID
  - `user_id` (uuid, foreign key) - References profiles
  - `aadhaar_number` (text) - Aadhaar card number (encrypted in production)
  - `pan_number` (text, optional) - PAN card number
  - `address_line1` (text) - Address line 1
  - `address_line2` (text) - Address line 2
  - `city` (text) - City name
  - `state` (text) - State name
  - `pincode` (text) - PIN code
  - `document_type` (text) - Type of document uploaded
  - `document_url` (text) - URL to uploaded document
  - `photo_url` (text) - URL to user photograph
  - `verification_status` (text) - pending/under_review/verified/rejected
  - `rejection_reason` (text, optional) - Reason if rejected
  - `verified_at` (timestamp) - When verification was completed
  - `submitted_at` (timestamp) - When application was submitted
  - `created_at` (timestamp) - Record creation time
  - `updated_at` (timestamp) - Last update time

  ## Security
  - Enable RLS on all tables
  - Users can only read/write their own data
  - Verification status updates are restricted
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  date_of_birth date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create kyc_verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  aadhaar_number text NOT NULL,
  pan_number text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  document_type text NOT NULL DEFAULT 'aadhaar',
  document_url text NOT NULL,
  photo_url text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
  rejection_reason text,
  verified_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- KYC verifications policies
CREATE POLICY "Users can view own KYC submissions"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own KYC submissions"
  ON kyc_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending KYC submissions"
  ON kyc_verifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND verification_status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kyc_verifications_updated_at ON kyc_verifications;
CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();