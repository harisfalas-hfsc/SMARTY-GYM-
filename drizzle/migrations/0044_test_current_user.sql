DO $$
BEGIN
  RAISE NOTICE 'Current user: %', current_user;
  RAISE NOTICE 'Session user: %', session_user;
END $$;