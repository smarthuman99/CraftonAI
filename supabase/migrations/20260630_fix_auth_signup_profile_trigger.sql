-- Crafton AI - Harden Supabase Auth signup trigger
-- Run this if Auth signup returns: "Database error saving new user".
--
-- The auth.users insert should never be blocked by an application profile
-- side-effect. This migration removes extension search_path fragility from
-- public_id generation and makes the profile trigger fail-open with a warning.

CREATE OR REPLACE FUNCTION public.generate_public_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'usr_' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12));
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        company,
        preferred_messenger,
        messenger_id,
        avatar_url
    )
    VALUES (
        NEW.id,
        coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'company',
        NEW.raw_user_meta_data ->> 'preferred_messenger',
        NEW.raw_user_meta_data ->> 'messenger_id',
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Crafton profile trigger failed for auth user %. Error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();
