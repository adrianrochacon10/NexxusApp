SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict juYTvbpBkkK7uk1ugNueW00jshTiBBsI7ARJIVdKtRjuQnopwwtexat9YcUrgZM

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'cd9769ae-93e9-4632-9138-32955c791a8e', 'authenticated', 'authenticated', 'kevinleonardorocha7@gmail.com', '$2a$10$f7WjnUtE5H8m1wdMA/QQFuThepNc24Ri4vpaqcjxwokE7ISLKabWS', '2026-05-29 01:24:27.119119+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-05-29 19:04:43.323805+00', '{"provider": "email", "providers": ["email"]}', '{"nombre": "Kevin", "email_verified": true}', NULL, '2026-05-29 01:24:27.116233+00', '2026-08-17 19:45:08.984758+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'authenticated', 'authenticated', 'adrianrochacon@gmail.com', '$2a$10$6Kae61QneT/R4gJHT0GODO0B.lo3ODIV5Vr4laZXgoRapiQkTDfsu', '2026-05-29 01:24:26.420741+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-11-05 03:04:08.554325+00', '{"provider": "email", "providers": ["email"]}', '{"nombre": "Adrian", "email_verified": true}', NULL, '2026-05-29 01:24:26.397804+00', '2026-11-05 14:48:32.439564+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'authenticated', 'authenticated', 'diegorochacon13@gmail.com', '$2a$10$Wufnix4oe2jZgftdc2uDquAW6sRyRz8dhZdCHVbDHuyeRwLFlVlsS', '2026-05-29 15:02:30.733294+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-06-01 15:47:36.598455+00', '{"provider": "email", "providers": ["email"]}', '{"nombre": "Diego", "email_verified": true}', NULL, '2026-05-29 15:02:30.729717+00', '2026-11-16 19:00:23.082016+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9dc37331-c923-49f6-9b95-ee808f22c90a', 'authenticated', 'authenticated', 'bristophermisaeld@gmail.com', '$2a$10$YZeK.q/az7q2pEe8Cscm8.Iv8we8SYTkdoH6cfpifTw689l8EQzti', '2026-05-29 15:02:30.102036+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-05 14:52:59.017298+00', '{"provider": "email", "providers": ["email"]}', '{"nombre": "Cristopher", "email_verified": true}', NULL, '2026-05-29 15:02:30.082388+00', '2026-08-05 14:57:02.563468+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '{"sub": "b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257", "email": "adrianrochacon@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-29 01:24:26.409428+00', '2026-05-29 01:24:26.409494+00', '2026-05-29 01:24:26.409494+00', '7a8478c0-cd42-4b8d-b187-7fc9a2c749b2'),
	('cd9769ae-93e9-4632-9138-32955c791a8e', 'cd9769ae-93e9-4632-9138-32955c791a8e', '{"sub": "cd9769ae-93e9-4632-9138-32955c791a8e", "email": "kevinleonardorocha7@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-29 01:24:27.117709+00', '2026-05-29 01:24:27.117787+00', '2026-05-29 01:24:27.117787+00', 'ccae28ea-0a48-42c2-9de2-3f3f4a322425'),
	('9dc37331-c923-49f6-9b95-ee808f22c90a', '9dc37331-c923-49f6-9b95-ee808f22c90a', '{"sub": "9dc37331-c923-49f6-9b95-ee808f22c90a", "email": "bristophermisaeld@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-29 15:02:30.099421+00', '2026-05-29 15:02:30.099477+00', '2026-05-29 15:02:30.099477+00', '245064c0-9a23-4690-937b-94f6b8215b91'),
	('b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', '{"sub": "b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f", "email": "diegorochacon13@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-29 15:02:30.731192+00', '2026-05-29 15:02:30.731243+00', '2026-05-29 15:02:30.731243+00', '902a93e9-b4c9-48f2-acca-844d52c74249');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('b0d767c0-0a47-4c34-8e39-d7f076a546a3', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '2026-05-29 02:48:06.096494+00', '2026-05-29 02:48:06.096494+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1 Brave', '177.226.101.17', NULL, NULL, NULL, NULL, NULL),
	('0339a715-9927-4489-addd-538ef4e57ea8', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '2026-11-04 04:34:16.863759+00', '2026-11-05 02:56:42.926456+00', NULL, 'aal1', NULL, '2026-11-05 02:56:42.926344', 'Next.js Middleware', '177.226.104.228', NULL, NULL, NULL, NULL, NULL),
	('5e834ce9-3b09-462d-a55d-2ca05851f004', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '2026-11-05 03:04:08.556767+00', '2026-11-05 14:48:32.481913+00', NULL, 'aal1', NULL, '2026-11-05 14:48:32.481044', 'Vercel Edge Functions', '98.83.158.38', NULL, NULL, NULL, NULL, NULL),
	('88cef9a6-ca60-431f-b9c1-ea85c335d39d', '9dc37331-c923-49f6-9b95-ee808f22c90a', '2026-05-29 20:05:45.283673+00', '2026-05-29 20:05:45.283673+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15', '189.218.8.226', NULL, NULL, NULL, NULL, NULL),
	('61cc3021-54ce-4511-bdc9-b447a39499ea', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '2026-05-29 15:11:32.163063+00', '2026-08-27 22:02:17.289685+00', NULL, 'aal1', NULL, '2026-08-27 22:02:17.289569', 'Vercel Edge Functions', '13.57.210.68', NULL, NULL, NULL, NULL, NULL),
	('c79a4bce-5acb-46bd-a937-172e2de40c9a', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', '2026-05-29 19:16:08.730473+00', '2026-11-16 19:00:23.105391+00', NULL, 'aal1', NULL, '2026-11-16 19:00:23.105282', 'Vercel Edge Functions', '100.31.79.232', NULL, NULL, NULL, NULL, NULL),
	('87f9b107-756c-4e15-b614-c723417a3e3d', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '2026-05-29 01:41:19.673216+00', '2026-07-14 03:46:08.234498+00', NULL, 'aal1', NULL, '2026-07-14 03:46:08.234351', 'Next.js Middleware', '177.226.106.209', NULL, NULL, NULL, NULL, NULL),
	('a632bc60-901d-42e6-93ab-12d8d012b397', 'cd9769ae-93e9-4632-9138-32955c791a8e', '2026-05-29 19:04:43.324753+00', '2026-08-17 19:45:08.998071+00', NULL, 'aal1', NULL, '2026-08-17 19:45:08.995277', 'Vercel Edge Functions', '54.67.107.96', NULL, NULL, NULL, NULL, NULL),
	('d42ad430-8377-46de-9b8d-501973ac33fb', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '2026-05-29 14:58:31.343542+00', '2026-09-23 16:15:29.001534+00', NULL, 'aal1', NULL, '2026-09-23 16:15:29.001452', 'Vercel Edge Functions', '52.53.182.181', NULL, NULL, NULL, NULL, NULL),
	('cff995a3-7676-4584-89e2-638b78847837', '9dc37331-c923-49f6-9b95-ee808f22c90a', '2026-08-05 14:52:59.017401+00', '2026-08-05 14:52:59.017401+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1', '189.218.12.134', NULL, NULL, NULL, NULL, NULL),
	('a2fb8528-c704-459d-a115-075bf21164ca', '9dc37331-c923-49f6-9b95-ee808f22c90a', '2026-05-29 16:41:31.577564+00', '2026-08-05 14:57:02.573594+00', NULL, 'aal1', NULL, '2026-08-05 14:57:02.573481', 'Vercel Edge Functions', '34.224.64.20', NULL, NULL, NULL, NULL, NULL),
	('c43ef6be-dc6b-431f-b763-af9421d2b85f', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', '2026-06-01 15:47:36.599768+00', '2026-10-12 18:33:32.977023+00', NULL, 'aal1', NULL, '2026-10-12 18:33:32.976899', 'Vercel Edge Functions', '34.234.86.141', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('87f9b107-756c-4e15-b614-c723417a3e3d', '2026-05-29 01:41:19.715561+00', '2026-05-29 01:41:19.715561+00', 'password', '5189e476-a650-4181-8deb-b3c5d9172ed5'),
	('b0d767c0-0a47-4c34-8e39-d7f076a546a3', '2026-05-29 02:48:06.145925+00', '2026-05-29 02:48:06.145925+00', 'password', '0039f074-d9f1-452b-9a08-9e1a9243df92'),
	('d42ad430-8377-46de-9b8d-501973ac33fb', '2026-05-29 14:58:31.376389+00', '2026-05-29 14:58:31.376389+00', 'password', 'c86996a4-5762-474d-979f-bd13211869f3'),
	('61cc3021-54ce-4511-bdc9-b447a39499ea', '2026-05-29 15:11:32.177909+00', '2026-05-29 15:11:32.177909+00', 'password', '6e929d42-ada5-4f11-b629-b39173c14cdc'),
	('a2fb8528-c704-459d-a115-075bf21164ca', '2026-05-29 16:41:31.596386+00', '2026-05-29 16:41:31.596386+00', 'password', '77b3778c-8d44-494a-a609-fa78aff5b15d'),
	('a632bc60-901d-42e6-93ab-12d8d012b397', '2026-05-29 19:04:43.357031+00', '2026-05-29 19:04:43.357031+00', 'password', 'eec31f11-14bd-45a7-bea5-11b46a9fbe9f'),
	('c79a4bce-5acb-46bd-a937-172e2de40c9a', '2026-05-29 19:16:08.743353+00', '2026-05-29 19:16:08.743353+00', 'password', '7cfc6a41-8b08-4fdf-9fe2-913e218c9ddd'),
	('88cef9a6-ca60-431f-b9c1-ea85c335d39d', '2026-05-29 20:05:45.30189+00', '2026-05-29 20:05:45.30189+00', 'password', '2bb74036-5eff-4adc-8f25-f679ed91f898'),
	('c43ef6be-dc6b-431f-b763-af9421d2b85f', '2026-06-01 15:47:36.628982+00', '2026-06-01 15:47:36.628982+00', 'password', '4c26ebe2-c338-499e-a5af-2df29731acd5'),
	('cff995a3-7676-4584-89e2-638b78847837', '2026-08-05 14:52:59.084403+00', '2026-08-05 14:52:59.084403+00', 'password', '6b8099d3-233b-4bf0-b234-85edeb28aaa7'),
	('0339a715-9927-4489-addd-538ef4e57ea8', '2026-11-04 04:34:16.904802+00', '2026-11-04 04:34:16.904802+00', 'password', '62a58978-b07d-48bb-b3c0-346c05d9991d'),
	('5e834ce9-3b09-462d-a55d-2ca05851f004', '2026-11-05 03:04:08.613171+00', '2026-11-05 03:04:08.613171+00', 'password', '16001c05-192b-4e6a-8a2a-74f77ba46d16');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_code_sets; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 2, '64dtenfmgvy7', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', false, '2026-05-29 02:48:06.123702+00', '2026-05-29 02:48:06.123702+00', NULL, 'b0d767c0-0a47-4c34-8e39-d7f076a546a3'),
	('00000000-0000-0000-0000-000000000000', 1, '7d45sn26qikx', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 01:41:19.698013+00', '2026-05-29 02:59:48.857233+00', NULL, '87f9b107-756c-4e15-b614-c723417a3e3d'),
	('00000000-0000-0000-0000-000000000000', 3, 'jrhk56ynvpjs', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 02:59:48.867952+00', '2026-05-29 14:07:47.306451+00', '7d45sn26qikx', '87f9b107-756c-4e15-b614-c723417a3e3d'),
	('00000000-0000-0000-0000-000000000000', 74, 'zhcy3lgoywca', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-04 04:44:46.188849+00', '2026-07-06 19:28:37.431779+00', 'umnlgpb5l2t2', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 47, '7pnfto7iis27', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-06-18 21:03:39.746499+00', '2026-07-14 02:44:18.708786+00', 'j7bjxgjm4jaq', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 4, 'gt3xl2fwf7m3', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 14:07:47.321977+00', '2026-07-14 03:46:08.20696+00', 'jrhk56ynvpjs', '87f9b107-756c-4e15-b614-c723417a3e3d'),
	('00000000-0000-0000-0000-000000000000', 5, 'dcp3raiyfxl4', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 14:58:31.36043+00', '2026-05-29 16:51:36.441045+00', NULL, 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 25, '3fatzo6pyg7g', '9dc37331-c923-49f6-9b95-ee808f22c90a', true, '2026-05-31 06:16:14.087593+00', '2026-08-05 14:57:02.555021+00', 'kncsek5sehvo', 'a2fb8528-c704-459d-a115-075bf21164ca'),
	('00000000-0000-0000-0000-000000000000', 8, 'yjry56srdplw', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 16:51:36.44982+00', '2026-05-29 19:03:37.714306+00', 'dcp3raiyfxl4', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 6, 'tkz4gdldnbqo', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 15:11:32.172909+00', '2026-05-29 19:58:02.195414+00', NULL, '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 7, '3db63rrj2caw', '9dc37331-c923-49f6-9b95-ee808f22c90a', true, '2026-05-29 16:41:31.589407+00', '2026-05-29 20:04:59.877541+00', NULL, 'a2fb8528-c704-459d-a115-075bf21164ca'),
	('00000000-0000-0000-0000-000000000000', 14, 'z2zrg6tlabf5', '9dc37331-c923-49f6-9b95-ee808f22c90a', false, '2026-05-29 20:05:45.296398+00', '2026-05-29 20:05:45.296398+00', NULL, '88cef9a6-ca60-431f-b9c1-ea85c335d39d'),
	('00000000-0000-0000-0000-000000000000', 10, 'ekt5n2byehpp', 'cd9769ae-93e9-4632-9138-32955c791a8e', true, '2026-05-29 19:04:43.347431+00', '2026-05-29 20:23:04.821983+00', NULL, 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 11, 'bs4wfbmb5gdw', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-05-29 19:16:08.7373+00', '2026-05-29 20:26:11.297713+00', NULL, 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 9, 'j5n3wsvkdfna', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 19:03:37.723988+00', '2026-05-29 21:03:00.804383+00', 'yjry56srdplw', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 16, 'eap36m5z3kz7', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-05-29 20:26:11.306928+00', '2026-05-29 21:32:36.803977+00', 'bs4wfbmb5gdw', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 18, 'rzh7nn5objmk', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-05-29 21:32:36.812567+00', '2026-05-29 23:06:19.504113+00', 'eap36m5z3kz7', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 15, 'tmkwjukgq3lm', 'cd9769ae-93e9-4632-9138-32955c791a8e', true, '2026-05-29 20:23:04.832239+00', '2026-05-29 23:52:34.911611+00', 'ekt5n2byehpp', 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 12, 'ilwsyzfd3fcu', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 19:58:02.20345+00', '2026-05-30 06:20:19.727116+00', 'tkz4gdldnbqo', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 13, 'p4ddv4tjmfdq', '9dc37331-c923-49f6-9b95-ee808f22c90a', true, '2026-05-29 20:04:59.883793+00', '2026-05-30 17:36:28.133593+00', '3db63rrj2caw', 'a2fb8528-c704-459d-a115-075bf21164ca'),
	('00000000-0000-0000-0000-000000000000', 21, 'tmmchwrgrkkg', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-30 06:20:19.74037+00', '2026-05-31 00:18:39.441964+00', 'ilwsyzfd3fcu', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 20, '2knwuusn7vba', 'cd9769ae-93e9-4632-9138-32955c791a8e', true, '2026-05-29 23:52:34.91943+00', '2026-05-31 01:25:08.018595+00', 'tmkwjukgq3lm', 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 22, 'kncsek5sehvo', '9dc37331-c923-49f6-9b95-ee808f22c90a', true, '2026-05-30 17:36:28.154706+00', '2026-05-31 06:16:14.08135+00', 'p4ddv4tjmfdq', 'a2fb8528-c704-459d-a115-075bf21164ca'),
	('00000000-0000-0000-0000-000000000000', 17, 'pgxchwoc5f6z', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-29 21:03:00.816644+00', '2026-06-01 14:16:15.261386+00', 'j5n3wsvkdfna', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 23, '53d4zc4xbqvq', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-05-31 00:18:39.454523+00', '2026-06-01 15:28:09.250388+00', 'tmmchwrgrkkg', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 27, 'vfniixjkl2ts', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-06-01 15:28:09.255553+00', '2026-06-03 16:04:30.085249+00', '53d4zc4xbqvq', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 28, 'tltk7bve27ql', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-01 15:47:36.623844+00', '2026-06-08 00:27:47.328247+00', NULL, 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 30, 's7sh7aivj5us', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-08 00:27:47.349418+00', '2026-06-08 06:04:08.19898+00', 'tltk7bve27ql', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 31, 'f7vnc45iip7g', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-08 06:04:08.212019+00', '2026-06-08 15:43:45.353125+00', 's7sh7aivj5us', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 19, '2yagddturio6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-05-29 23:06:19.512427+00', '2026-06-08 21:01:55.733524+00', 'rzh7nn5objmk', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 32, 'flrpcf2o7xv6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-08 15:43:45.379438+00', '2026-06-09 18:00:17.920521+00', 'f7vnc45iip7g', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 34, 'h2ox7c556evm', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-09 18:00:17.943071+00', '2026-06-09 20:21:37.237104+00', 'flrpcf2o7xv6', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 26, 'jawdrpuuovd4', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-06-01 14:16:15.34462+00', '2026-06-12 01:35:21.677753+00', 'pgxchwoc5f6z', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 35, 'cq3ngodvlpdk', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-09 20:21:37.249436+00', '2026-06-12 04:24:58.92585+00', 'h2ox7c556evm', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 36, 'hunbu7vxxezf', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-06-12 01:35:21.694781+00', '2026-06-12 14:03:07.95594+00', 'jawdrpuuovd4', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 33, 'kuati2eqeryr', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-08 21:01:55.748769+00', '2026-06-12 18:31:05.413944+00', '2yagddturio6', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 39, 'ke3gqi54win7', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-12 18:31:05.419648+00', '2026-06-12 23:06:57.576636+00', 'kuati2eqeryr', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 37, 'gpngisllt7b6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-12 04:24:58.93442+00', '2026-06-14 23:52:33.192722+00', 'cq3ngodvlpdk', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 41, 'pfonqn5243lq', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-14 23:52:33.207543+00', '2026-06-15 03:31:01.965268+00', 'gpngisllt7b6', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 42, 'pjxrpzc5z3bv', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-15 03:31:01.986695+00', '2026-06-15 04:35:58.703522+00', 'pfonqn5243lq', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 43, 'ynhcf7b4wfyj', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-15 04:35:58.712796+00', '2026-06-15 17:38:54.343472+00', 'pjxrpzc5z3bv', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 24, 'yojfuuss7ijk', 'cd9769ae-93e9-4632-9138-32955c791a8e', true, '2026-05-31 01:25:08.026235+00', '2026-06-16 20:01:01.392499+00', '2knwuusn7vba', 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 40, 'fkcgjaw4squp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-12 23:06:57.593388+00', '2026-06-16 20:12:47.768871+00', 'ke3gqi54win7', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 38, 'j7bjxgjm4jaq', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-06-12 14:03:07.978715+00', '2026-06-18 21:03:39.732791+00', 'hunbu7vxxezf', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 44, 'u6yeqh2k2rz2', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-15 17:38:54.370502+00', '2026-06-19 20:48:37.514308+00', 'ynhcf7b4wfyj', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 48, 'bdbqde7onqrq', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-19 20:48:37.529456+00', '2026-06-20 18:25:41.323677+00', 'u6yeqh2k2rz2', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 49, 'kcxtc63v7xtp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-20 18:25:41.344759+00', '2026-06-20 20:39:20.064597+00', 'bdbqde7onqrq', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 50, 'mddjzx3zhola', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-20 20:39:20.076416+00', '2026-06-21 01:17:09.077133+00', 'kcxtc63v7xtp', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 45, 'bcocgh5o2fou', 'cd9769ae-93e9-4632-9138-32955c791a8e', true, '2026-06-16 20:01:01.409372+00', '2026-06-21 21:56:51.551679+00', 'yojfuuss7ijk', 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 46, '3eqihuimdhbn', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-16 20:12:47.776281+00', '2026-06-22 21:14:02.769803+00', 'fkcgjaw4squp', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 71, 'x7tnyohwbikr', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-02 20:10:29.806845+00', '2026-07-03 04:42:13.216759+00', 'ljf2lomvclvt', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 51, 'kmiuamw3mc6q', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-21 01:17:09.095369+00', '2026-06-21 03:27:31.084344+00', 'mddjzx3zhola', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 72, 'rfsspbgrogmq', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-03 04:42:13.233851+00', '2026-07-04 03:03:57.94445+00', 'x7tnyohwbikr', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 52, 'jqa2urelgduq', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-21 03:27:31.097442+00', '2026-06-21 17:50:06.067247+00', 'kmiuamw3mc6q', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 77, 'pgap6dbtkuyn', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-07-14 02:44:18.71909+00', '2026-09-19 00:56:03.032409+00', '7pnfto7iis27', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 53, 'rv6hqlc6rdk7', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-21 17:50:06.086501+00', '2026-06-22 02:16:25.065542+00', 'jqa2urelgduq', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 73, 'umnlgpb5l2t2', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-04 03:03:57.966786+00', '2026-07-04 04:44:46.183204+00', 'rfsspbgrogmq', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 55, 'q43btc7saa33', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-22 02:16:25.074405+00', '2026-06-22 04:03:37.374254+00', 'rv6hqlc6rdk7', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 29, 'krqmjiidcpxp', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-06-03 16:04:30.106201+00', '2026-07-05 22:17:56.849773+00', 'vfniixjkl2ts', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 56, 'k7gsy7cdmkfz', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-22 04:03:37.38045+00', '2026-06-22 05:45:29.189935+00', 'q43btc7saa33', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 57, 'tetsseuy4yiy', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-22 05:45:29.198222+00', '2026-06-22 19:55:47.208269+00', 'k7gsy7cdmkfz', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 58, 'omayj4di5pj5', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-22 19:55:47.232191+00', '2026-06-23 04:20:37.557692+00', 'tetsseuy4yiy', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 76, '4z54kxlmy6ff', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-06 19:28:37.447218+00', '2026-07-14 03:34:59.075226+00', 'zhcy3lgoywca', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 59, 'qyzm7wee6434', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-22 21:14:02.784282+00', '2026-06-23 22:35:27.915471+00', '3eqihuimdhbn', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 60, 'uof4si3pzi7n', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-23 04:20:37.577566+00', '2026-06-24 02:32:47.976233+00', 'omayj4di5pj5', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 79, 'dr742gu46fyy', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', false, '2026-07-14 03:46:08.216481+00', '2026-07-14 03:46:08.216481+00', 'gt3xl2fwf7m3', '87f9b107-756c-4e15-b614-c723417a3e3d'),
	('00000000-0000-0000-0000-000000000000', 62, 'uhmeus7il2hy', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-24 02:32:47.993503+00', '2026-06-24 03:36:01.507417+00', 'uof4si3pzi7n', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 75, '6pgu5cyklo5i', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-07-05 22:17:56.880608+00', '2026-07-15 15:50:21.072835+00', 'krqmjiidcpxp', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 63, 'vuv6enl7q7lh', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-24 03:36:01.514593+00', '2026-06-24 18:15:14.441481+00', 'uhmeus7il2hy', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 64, 'qrrikc7alu3l', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-24 18:15:14.462929+00', '2026-06-25 21:52:45.428724+00', 'vuv6enl7q7lh', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 78, 'reukwucqd3he', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-14 03:34:59.097932+00', '2026-07-17 18:35:10.441295+00', '4z54kxlmy6ff', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 65, 'imsusuhefp3y', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-25 21:52:45.452756+00', '2026-06-28 22:39:42.935895+00', 'qrrikc7alu3l', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 66, 'lnljhmgsbolh', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-28 22:39:42.956885+00', '2026-06-29 01:59:54.272043+00', 'imsusuhefp3y', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 81, 'vaavmii4psb5', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-17 18:35:10.457798+00', '2026-07-17 21:08:28.872472+00', 'reukwucqd3he', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 67, 'frcyml3q5qtp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-29 01:59:54.287306+00', '2026-06-29 17:33:39.747451+00', 'lnljhmgsbolh', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 61, 'h7u6mfnip7ot', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-23 22:35:27.9395+00', '2026-06-30 02:29:13.501749+00', 'qyzm7wee6434', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 68, 'ztkq4yko7iou', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-29 17:33:39.769542+00', '2026-06-30 03:15:09.356578+00', 'frcyml3q5qtp', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 82, 'vedvrzguwg4l', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-17 21:08:28.879818+00', '2026-07-21 17:17:47.559365+00', 'vaavmii4psb5', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 70, 'ljf2lomvclvt', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-30 03:15:09.367043+00', '2026-07-02 20:10:29.786669+00', 'ztkq4yko7iou', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 83, 'bys65fchxpmk', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-21 17:17:47.570286+00', '2026-07-21 19:30:13.586329+00', 'vedvrzguwg4l', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 84, 'e63widbaw7lt', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-21 19:30:13.591486+00', '2026-07-21 20:58:51.987634+00', 'bys65fchxpmk', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 85, 'lqxrtkxqmtqg', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-21 20:58:51.992513+00', '2026-07-21 22:50:30.598007+00', 'e63widbaw7lt', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 69, 'hnvoqxgxuagt', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-06-30 02:29:13.517287+00', '2026-07-21 23:15:26.114205+00', 'h7u6mfnip7ot', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 86, 'gizi73ytft7q', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-21 22:50:30.602727+00', '2026-07-22 01:15:21.591806+00', 'lqxrtkxqmtqg', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 88, 'fsfb4xv5ggcp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-22 01:15:21.596726+00', '2026-07-22 06:01:33.583074+00', 'gizi73ytft7q', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 87, 'szjfaywhk5ce', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-21 23:15:26.121882+00', '2026-07-22 19:41:02.493834+00', 'hnvoqxgxuagt', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 90, 'obogcdx2dbyh', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-22 19:41:02.511399+00', '2026-07-22 20:41:56.139779+00', 'szjfaywhk5ce', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 89, 'iejdr3n2mnq6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-22 06:01:33.608943+00', '2026-07-22 21:42:52.710507+00', 'fsfb4xv5ggcp', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 92, 'p3ka7jktkih6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-22 21:42:52.719676+00', '2026-07-23 21:45:38.750013+00', 'iejdr3n2mnq6', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 93, 'ys4fas7xlhms', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-23 21:45:38.770764+00', '2026-07-24 19:46:33.263793+00', 'p3ka7jktkih6', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 91, 'mmti6ccnlh4e', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-22 20:41:56.15128+00', '2026-07-24 19:46:45.609779+00', 'obogcdx2dbyh', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 95, 'dvzwqczygs3k', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-24 19:46:45.619677+00', '2026-07-24 20:51:07.466944+00', 'mmti6ccnlh4e', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 96, 'mjsjr6o43jp5', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-24 20:51:07.47915+00', '2026-07-24 22:58:01.782195+00', 'dvzwqczygs3k', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 97, 'ju4ubznvsmuq', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-24 22:58:01.78605+00', '2026-07-25 17:32:31.18702+00', 'mjsjr6o43jp5', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 98, 'czptijbzulst', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-25 17:32:31.200515+00', '2026-07-25 20:26:55.823395+00', 'ju4ubznvsmuq', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 94, '2zh76r76whna', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-24 19:46:33.277379+00', '2026-07-26 23:09:54.018824+00', 'ys4fas7xlhms', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 100, 'dyqsgolblb6e', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-26 23:09:54.037159+00', '2026-07-27 16:13:51.512223+00', '2zh76r76whna', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 99, 'qotbdv4at6jb', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-25 20:26:55.84362+00', '2026-07-28 22:35:49.724152+00', 'czptijbzulst', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 54, 'ldbqvv4nwbf3', 'cd9769ae-93e9-4632-9138-32955c791a8e', true, '2026-06-21 21:56:51.560312+00', '2026-08-02 15:42:07.208523+00', 'bcocgh5o2fou', 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 80, '44hn3s3csp4f', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-07-15 15:50:21.089282+00', '2026-08-17 02:04:11.623617+00', '6pgu5cyklo5i', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 145, '35gjxu34ldzi', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-08-22 06:34:59.053841+00', '2026-08-25 22:01:04.271084+00', '6dqbknkywucv', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 101, '7xatxjleqd4k', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-27 16:13:51.524806+00', '2026-07-28 05:42:57.531208+00', 'dyqsgolblb6e', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 148, 'aza7iisw4wqb', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-24 12:54:41.466253+00', '2026-08-26 02:33:52.272809+00', 'nrtb22koxujw', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 152, 't4fbwdldspbz', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-26 02:33:52.278009+00', '2026-08-26 14:41:57.353864+00', 'aza7iisw4wqb', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 102, 'jkekgw44wp7x', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-28 05:42:57.543801+00', '2026-07-29 05:14:37.387496+00', '7xatxjleqd4k', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 104, 'jldx3gyctseb', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-29 05:14:37.406038+00', '2026-07-29 19:19:32.121816+00', 'jkekgw44wp7x', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 105, 'vvf4vwadtn5u', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-29 19:19:32.141438+00', '2026-07-30 00:13:55.283702+00', 'jldx3gyctseb', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 106, 'lxajubxk3tz6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-30 00:13:55.297691+00', '2026-07-30 03:11:18.251509+00', 'vvf4vwadtn5u', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 103, '7gckgxs6nrba', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-28 22:35:49.744045+00', '2026-07-30 03:42:15.553035+00', 'qotbdv4at6jb', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 108, 'h76x4jmnap5y', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-30 03:42:15.557854+00', '2026-07-30 04:41:12.439131+00', '7gckgxs6nrba', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 107, '5m7bpyjsxdrs', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-30 03:11:18.25988+00', '2026-08-01 17:03:06.182911+00', 'lxajubxk3tz6', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 110, 'pqaoomrtb2bl', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-01 17:03:06.198365+00', '2026-08-02 20:40:19.443343+00', '5m7bpyjsxdrs', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 112, 'm7b426imvnh5', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-02 20:40:19.453977+00', '2026-08-02 22:12:50.422464+00', 'pqaoomrtb2bl', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 113, '5y6fxoboxqkn', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-02 22:12:50.427844+00', '2026-08-03 06:14:56.12332+00', 'm7b426imvnh5', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 109, 'zkzbjqqhan3j', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-07-30 04:41:12.446164+00', '2026-08-03 20:57:34.800037+00', 'h76x4jmnap5y', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 114, 'b4bj76zrn6qp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-03 06:14:56.143328+00', '2026-08-05 04:28:07.585771+00', '5y6fxoboxqkn', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 117, 'exc4r6mgw6tu', '9dc37331-c923-49f6-9b95-ee808f22c90a', false, '2026-08-05 14:52:59.048813+00', '2026-08-05 14:52:59.048813+00', NULL, 'cff995a3-7676-4584-89e2-638b78847837'),
	('00000000-0000-0000-0000-000000000000', 118, 'rtk7hrwrss25', '9dc37331-c923-49f6-9b95-ee808f22c90a', false, '2026-08-05 14:57:02.559734+00', '2026-08-05 14:57:02.559734+00', '3fatzo6pyg7g', 'a2fb8528-c704-459d-a115-075bf21164ca'),
	('00000000-0000-0000-0000-000000000000', 116, '3cjzxzxsbotk', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-05 04:28:07.595989+00', '2026-08-07 03:58:57.363364+00', 'b4bj76zrn6qp', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 115, 'jonixyjlmvop', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-03 20:57:34.817281+00', '2026-08-07 21:30:24.476452+00', 'zkzbjqqhan3j', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 120, 'sdt26tceo6rw', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-07 21:30:24.498592+00', '2026-08-08 05:18:50.949775+00', 'jonixyjlmvop', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 121, '6pdfgv6fxxy6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-08 05:18:50.969458+00', '2026-08-08 17:29:41.946947+00', 'sdt26tceo6rw', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 119, '2uwkx6au2xff', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-07 03:58:57.379703+00', '2026-08-09 20:38:16.450301+00', '3cjzxzxsbotk', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 122, '4j37iw6pzrso', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-08 17:29:41.96273+00', '2026-08-10 02:42:18.09429+00', '6pdfgv6fxxy6', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 124, 'zchgjriaqm6u', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-10 02:42:18.107727+00', '2026-08-10 22:02:29.740543+00', '4j37iw6pzrso', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 123, 'l6b7lznn6ng6', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-09 20:38:16.46669+00', '2026-08-14 04:48:03.420403+00', '2uwkx6au2xff', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 125, 'q2sqro5yzfh7', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-10 22:02:29.758656+00', '2026-08-14 22:51:41.59492+00', 'zchgjriaqm6u', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 126, 'uftn7vxq7kzo', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-14 04:48:03.44471+00', '2026-08-15 05:02:09.038343+00', 'l6b7lznn6ng6', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 128, '4eueuoqg7h5g', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-15 05:02:09.053966+00', '2026-08-16 05:33:03.249432+00', 'uftn7vxq7kzo', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 129, 'nbgvnhbfhupo', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-16 05:33:03.267458+00', '2026-08-16 06:37:04.682341+00', '4eueuoqg7h5g', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 130, '7echfazyulm3', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-16 06:37:04.687366+00', '2026-08-16 20:42:44.234904+00', 'nbgvnhbfhupo', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 131, '5mv3km3je2qp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-16 20:42:44.25076+00', '2026-08-17 02:03:28.13651+00', '7echfazyulm3', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 132, 'dn7apsgh4yok', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-17 02:03:28.144086+00', '2026-08-17 06:19:18.571641+00', '5mv3km3je2qp', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 133, 'lwyv7tt3zqhy', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-08-17 02:04:11.631193+00', '2026-08-17 14:13:29.308681+00', '44hn3s3csp4f', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 111, 'gcfg6ymfwrmi', 'cd9769ae-93e9-4632-9138-32955c791a8e', true, '2026-08-02 15:42:07.224626+00', '2026-08-17 19:45:08.959579+00', 'ldbqvv4nwbf3', 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 136, 'fyd3k62kuc6b', 'cd9769ae-93e9-4632-9138-32955c791a8e', false, '2026-08-17 19:45:08.9756+00', '2026-08-17 19:45:08.9756+00', 'gcfg6ymfwrmi', 'a632bc60-901d-42e6-93ab-12d8d012b397'),
	('00000000-0000-0000-0000-000000000000', 134, '6bjx5j5ye5zc', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-17 06:19:18.590057+00', '2026-08-17 20:24:14.326045+00', 'dn7apsgh4yok', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 137, 'd5vfr56y6txe', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-17 20:24:14.332362+00', '2026-08-17 22:51:34.508848+00', '6bjx5j5ye5zc', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 127, '3yp24x2m52qu', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-14 22:51:41.615474+00', '2026-08-18 01:51:35.839+00', 'q2sqro5yzfh7', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 135, 'uwf53kzfl6ke', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-08-17 14:13:29.321077+00', '2026-08-19 14:04:00.193264+00', 'lwyv7tt3zqhy', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 139, 'c2bmrdcodqxb', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-18 01:51:35.849065+00', '2026-08-20 17:19:57.454894+00', '3yp24x2m52qu', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 140, 'iuewafzl7b66', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-08-19 14:04:00.212301+00', '2026-08-20 21:24:37.220173+00', 'uwf53kzfl6ke', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 138, 'n7mketejaz2t', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-17 22:51:34.517564+00', '2026-08-21 20:24:00.207846+00', 'd5vfr56y6txe', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 143, '56gm5zau67fr', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-21 20:24:00.223079+00', '2026-08-21 22:05:23.798726+00', 'n7mketejaz2t', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 142, '6dqbknkywucv', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-08-20 21:24:37.23785+00', '2026-08-22 06:34:59.036327+00', 'iuewafzl7b66', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 144, '7qvpirtgwaav', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-21 22:05:23.804259+00', '2026-08-22 21:35:41.70559+00', '56gm5zau67fr', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 146, '3rjxomkyfslx', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-22 21:35:41.720819+00', '2026-08-22 22:51:19.369324+00', '7qvpirtgwaav', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 147, 'nrtb22koxujw', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-22 22:51:19.37413+00', '2026-08-24 12:54:41.450754+00', '3rjxomkyfslx', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 141, 'zxjerbrbraav', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-20 17:19:57.472523+00', '2026-08-24 22:12:36.570816+00', 'c2bmrdcodqxb', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 149, 'm4maygjkdarl', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-24 22:12:36.591047+00', '2026-08-25 01:57:13.440105+00', 'zxjerbrbraav', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 150, 'd3gacu6bfmmd', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-25 01:57:13.451942+00', '2026-08-27 02:58:36.400562+00', 'm4maygjkdarl', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 151, '6n63hzmkyjup', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-08-25 22:01:04.288352+00', '2026-08-27 22:02:17.255233+00', '35gjxu34ldzi', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 155, 'lbvkxfpkuctt', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', false, '2026-08-27 22:02:17.269219+00', '2026-08-27 22:02:17.269219+00', '6n63hzmkyjup', '61cc3021-54ce-4511-bdc9-b447a39499ea'),
	('00000000-0000-0000-0000-000000000000', 154, 'pvyuvv2vlrlp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-27 02:58:36.416315+00', '2026-09-19 02:27:35.814874+00', 'd3gacu6bfmmd', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 156, 'vuo7msf4qfp5', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-09-19 00:56:03.042334+00', '2026-09-19 18:34:07.075136+00', 'pgap6dbtkuyn', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 153, 'pnynjdyrcxnu', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-08-26 14:41:57.380986+00', '2026-09-21 18:28:50.58465+00', 't4fbwdldspbz', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 157, 'j35x75d3cscp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-09-19 02:27:35.832535+00', '2026-09-23 02:38:10.228487+00', 'pvyuvv2vlrlp', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 160, 'ehjp4nojljwq', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-09-23 02:38:10.246204+00', '2026-09-23 05:22:27.780713+00', 'j35x75d3cscp', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 158, 'ccyrxn2pm6fw', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-09-19 18:34:07.094662+00', '2026-09-23 14:15:14.981369+00', 'vuo7msf4qfp5', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 162, 'lntkkzmju72h', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-09-23 14:15:14.990385+00', '2026-09-23 16:15:28.917259+00', 'ccyrxn2pm6fw', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 163, 'hmyizmeiwlpk', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', false, '2026-09-23 16:15:28.928217+00', '2026-09-23 16:15:28.928217+00', 'lntkkzmju72h', 'd42ad430-8377-46de-9b8d-501973ac33fb'),
	('00000000-0000-0000-0000-000000000000', 161, 'tlj6a3svzyet', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-09-23 05:22:27.793992+00', '2026-09-25 15:56:46.365637+00', 'ehjp4nojljwq', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 164, 'vf23eqe22io4', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-09-25 15:56:46.380103+00', '2026-09-25 18:35:13.848528+00', 'tlj6a3svzyet', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 159, '2dkazvqgj2qy', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-09-21 18:28:50.605197+00', '2026-10-02 05:11:23.231666+00', 'pnynjdyrcxnu', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 166, 'lll7yjx6bmuv', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-10-02 05:11:23.246576+00', '2026-10-02 21:55:36.912803+00', '2dkazvqgj2qy', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 167, 'nhqjftlciw4i', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-10-02 21:55:36.929043+00', '2026-10-03 01:20:33.703819+00', 'lll7yjx6bmuv', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 168, 'ehgkxuvzvjsw', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-10-03 01:20:33.717091+00', '2026-10-12 18:33:32.930132+00', 'nhqjftlciw4i', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 169, 'beluc3ta7zdp', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', false, '2026-10-12 18:33:32.947168+00', '2026-10-12 18:33:32.947168+00', 'ehgkxuvzvjsw', 'c43ef6be-dc6b-431f-b763-af9421d2b85f'),
	('00000000-0000-0000-0000-000000000000', 170, 'pi6tbq3c7q32', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-11-04 04:34:16.885329+00', '2026-11-05 02:56:42.869029+00', NULL, '0339a715-9927-4489-addd-538ef4e57ea8'),
	('00000000-0000-0000-0000-000000000000', 171, 'cqtwibgzfdul', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', false, '2026-11-05 02:56:42.892068+00', '2026-11-05 02:56:42.892068+00', 'pi6tbq3c7q32', '0339a715-9927-4489-addd-538ef4e57ea8'),
	('00000000-0000-0000-0000-000000000000', 165, 'u5o3ekrim6hl', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-09-25 18:35:13.864563+00', '2026-11-05 02:57:09.028412+00', 'vf23eqe22io4', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 173, 'ipib3sr47q3y', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', true, '2026-11-05 03:04:08.597937+00', '2026-11-05 14:48:32.421104+00', NULL, '5e834ce9-3b09-462d-a55d-2ca05851f004'),
	('00000000-0000-0000-0000-000000000000', 174, 'oxas2zfukiw3', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', false, '2026-11-05 14:48:32.434266+00', '2026-11-05 14:48:32.434266+00', 'ipib3sr47q3y', '5e834ce9-3b09-462d-a55d-2ca05851f004'),
	('00000000-0000-0000-0000-000000000000', 172, '7kxpdylj7num', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-11-05 02:57:09.031635+00', '2026-11-09 14:01:15.981222+00', 'u5o3ekrim6hl', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 175, 'tgmdujegquj7', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-11-09 14:01:15.998813+00', '2026-11-11 03:18:59.041832+00', '7kxpdylj7num', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 176, 'sd6sxm3keddv', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-11-11 03:18:59.06459+00', '2026-11-11 14:09:45.81643+00', 'tgmdujegquj7', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 177, 'd36mhij6zu53', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-11-11 14:09:45.834305+00', '2026-11-13 19:56:15.342592+00', 'sd6sxm3keddv', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 178, 'mkpeahg6q2jq', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-11-13 19:56:15.36039+00', '2026-11-16 05:23:40.857145+00', 'd36mhij6zu53', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 179, 'd2ea7ksbw47e', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-11-16 05:23:40.877353+00', '2026-11-16 17:21:53.556585+00', 'mkpeahg6q2jq', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 180, 'b7zruzunry67', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', true, '2026-11-16 17:21:53.57435+00', '2026-11-16 19:00:23.071787+00', 'd2ea7ksbw47e', 'c79a4bce-5acb-46bd-a937-172e2de40c9a'),
	('00000000-0000-0000-0000-000000000000', 181, 'nwhudpvkqud2', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', false, '2026-11-16 19:00:23.078957+00', '2026-11-16 19:00:23.078957+00', 'b7zruzunry67', 'c79a4bce-5acb-46bd-a937-172e2de40c9a');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."businesses" ("id", "name", "slug", "created_by", "created_at", "updated_at") VALUES
	('00000000-0000-0000-0000-000000000001', 'Nexxuz', 'nexxuz', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00');


--
-- Data for Name: business_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."business_memberships" ("id", "business_id", "user_id", "role", "status", "invited_by", "joined_at", "created_at") VALUES
	('74433612-4b22-4435-8e76-b92d934eb3eb', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'admin', 'active', NULL, '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('d4b37c87-2906-4cf5-b392-4cd23aba9eae', '00000000-0000-0000-0000-000000000001', 'cd9769ae-93e9-4632-9138-32955c791a8e', 'admin', 'active', NULL, '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('b813d611-f621-4872-8d47-113a28819114', '00000000-0000-0000-0000-000000000001', '9dc37331-c923-49f6-9b95-ee808f22c90a', 'admin', 'active', NULL, '2026-05-29 15:02:52.010029+00', '2026-05-29 15:02:52.010029+00'),
	('0c24c12d-081c-4f26-b66c-07a39cdeae1e', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'admin', 'active', NULL, '2026-05-29 15:02:52.010029+00', '2026-05-29 15:02:52.010029+00');


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categorias" ("id", "business_id", "user_id", "nombre", "tipo", "icono", "color", "atributos_base", "created_at", "updated_at") VALUES
	('229eb7bd-ec6b-451f-851d-65e80c987268', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'Playeras', 'producto', NULL, '#4a6b9b', '{Talla,Color,Marca,"Tipo de tela"}', '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('01cfd390-71a8-470a-b464-89aee77c47ce', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'Perfumes', 'producto', NULL, '#c9a84c', '{Mililitros,Aroma,Genero,Marca}', '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('9d781f5a-1e36-49f2-9962-b50fb70f4b90', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'Ventas', 'ingreso', NULL, '#4a9b6f', '{}', '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('0fa5dc07-cd51-4a8a-9b78-bd5f0ca57447', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'Transporte', 'gasto', NULL, '#9b7a4a', '{}', '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('7d89d4df-6322-44aa-baef-1458f839543a', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'Publicidad', 'gasto', NULL, '#9b4a4a', '{}', '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('82df08f8-9eaa-4265-beba-47b78cd7d1f6', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'Inventario', 'gasto', NULL, '#4a6b9b', '{}', '2026-05-29 01:26:16.510701+00', '2026-05-29 01:26:16.510701+00'),
	('36d9e06f-6c42-4127-9289-3f4884c298a9', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Sudaderas', 'producto', NULL, '#3B4FD8', '{"S a XL"}', '2026-11-11 14:31:03.368885+00', '2026-11-11 14:31:03.368885+00');


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."productos" ("id", "business_id", "user_id", "nombre", "descripcion", "categoria_id", "precio_venta", "precio_costo", "stock", "stock_minimo", "imagen_url", "estatus", "sku", "atributos", "created_at", "updated_at") VALUES
	('01fe3355-f6ca-4744-913b-549d79a02a56', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Amber romance', NULL, '01cfd390-71a8-470a-b464-89aee77c47ce', 300.00, 215.00, 1, 1, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/0a41207d-0607-41d2-ac2b-370435e23bd9.jpeg', 'disponible', 'PER-472680', '{"Aroma": "Amber romance", "Marca": "Victoria´s Secret", "Genero": "", "Mililitros": "250ml "}', '2026-05-29 21:14:49.46094+00', '2026-05-29 21:14:49.46094+00'),
	('f3b9ef56-29bd-4287-84e2-7f4422aa5b40', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Boss', 'Boss/Porsche', '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 0, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/c2a3e805-2836-441d-ae03-bc75794abaf8.jpg', 'agotado', 'PLA-671229', '{"Color": "Negra", "Marca": "Boss", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:39:42.679317+00', '2026-06-22 21:18:42.563747+00'),
	('50fb06ca-e1e2-4c56-816c-da9cda42b4ab', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Palm Angels ', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 4, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/773fb228-fcb4-45bb-9f28-7ddb397d2b8d.jpg', 'disponible', 'PLA-209915', '{"Color": "Negra", "Marca": "Palm Angels ", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:32:33.691149+00', '2026-07-30 04:27:11.271004+00'),
	('e91469ce-1f56-4e9a-a246-ec113b576a17', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'karl lagerfeld', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/504c3875-28b1-4e8d-b486-1e0ad3eab42d.jpg', 'disponible', 'PLA-812409', '{"Color": "Negra", "Marca": "karl lagerfeld", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-08-08 05:22:39.992028+00', '2026-08-18 02:00:31.728077+00'),
	('9beaf4b9-a35d-4d03-8bc7-13fa758669c9', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'OffWhite ', 'Negra/Naranja', '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 2, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/867e60ab-0265-41c5-b98c-5a2c856f5ca1.jpg', 'disponible', 'PLA-806289', '{"Color": "Negra", "Marca": "OffWhite", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:09:32.123928+00', '2026-08-18 02:02:08.573072+00'),
	('1646d064-9a0d-421d-9fb2-5bfb905c7cae', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Stüssy', 'Bola ocho', '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 1, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/4ac17919-c4b9-4741-8b45-29412b99ebce.jpg', 'disponible', 'PLA-604046', '{"Color": "Blanca", "Marca": "Stüssy", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:38:04.285771+00', '2026-06-30 02:43:46.596576+00'),
	('fa841709-0365-48c8-a315-33b0beee2bfc', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Palm Angels ', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 3, 2, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/f2112a1f-ba43-46ec-b2d8-de5c0fbfc9dc.jpeg', 'disponible', 'PLA-795429', '{"Color": "Blanca", "Marca": "Palm Angels ", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:03:53.787037+00', '2026-09-23 02:44:02.232724+00'),
	('f09ff7ea-c59b-40d8-8598-b364e4355ecd', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Armani Exchange ', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 2, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/9a63bdd9-9cad-4b27-ba5d-4766f6a9329f.jpeg', 'disponible', 'PLA-738075', '{"Color": "Azul", "Marca": "Armani Exchange ", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:00:36.129932+00', '2026-06-22 21:18:20.599267+00'),
	('55990f85-faf8-49af-836a-21445a8cdc9d', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'ALLSAINTS', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 2, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/7949350e-7cbc-4212-9fa7-909607a01798.jpg', 'disponible', 'PLA-582959', '{"Color": "Blanca", "Marca": "ALLSAINTS", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:27:04.387761+00', '2026-07-25 17:32:58.700585+00'),
	('942cbce5-5042-40cb-a0a6-d74b38457a28', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Hugo', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 3, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/9a630779-f3cf-464d-84f6-c89991b2fce3.jpg', 'disponible', 'PLA-490732', '{"Color": "Negra", "Marca": "Hugo", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-07-30 04:42:02.36803+00', '2026-07-30 04:42:02.36803+00'),
	('d9a8baa0-0493-44e9-816b-95981c073b94', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Hugo', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 3, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/032e3a03-0e99-476b-8074-7203cd5923b0.jpg', 'disponible', 'PLA-672201', '{"Color": "Rojo", "Marca": "Hugo", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:36:55.144534+00', '2026-08-08 05:30:08.70588+00'),
	('0b4b6aa5-27c4-40f7-9333-79984061f1a7', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'ALLSAINTS', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 1, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/ba72700c-feb9-477b-8614-13f6256fd812.jpg', 'disponible', 'PLA-827043', '{"Color": "Negra", "Marca": "ALLSAINTS", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:31:08.087618+00', '2026-06-30 02:46:10.220933+00'),
	('50de88f7-cead-4013-8d4c-be1cb866a526', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Armani Exchange ', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 0, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/d2776183-a93a-40a4-8839-2e25442e640d.jpeg', 'agotado', 'PLA-451127', '{"Color": "Negra", "Marca": "Armani Exchange ", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-06-22 21:43:28.404104+00', '2026-07-25 17:33:38.373729+00'),
	('5bfb86d1-bee9-410e-8f98-fc715cffb665', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'OffWhite ', 'Negra/Blanco', '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 2, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/9a312a33-5ea5-4504-9b6a-73ac8d52eeba.jpg', 'disponible', 'PLA-908746', '{"Color": "Negra", "Marca": "OffWhite", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:07:42.632319+00', '2026-07-28 22:36:28.237284+00'),
	('ea6357eb-6368-41b3-8780-3c5bf90e91ea', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Boss', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 3, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/ea8a7a9b-9532-4ab6-82ce-c4cbd8fb6be1.jpeg', 'disponible', 'PLA-811220', '{"Color": "Negra", "Marca": "Boss", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:43:15.230217+00', '2026-07-30 04:42:31.2226+00'),
	('b8bcc7b5-f5e7-4aa4-b98b-86508aaec15d', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Hugo', 'Hugo color negra con las letras blancas con fuego', '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 3, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/425476df-127b-4e59-8bfa-2efcdaedcd76.jpg', 'disponible', 'PLA-255254', '{"Color": "Negra", "Marca": "Hugo", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:35:10.648935+00', '2026-07-30 04:42:56.116575+00'),
	('c1e39929-270d-489b-86df-7cd49f658748', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Tommy Hilfiger', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/fef16e40-c4ea-46c8-accc-9874f18c000c.jpeg', 'disponible', 'PLA-389849', '{"Color": "Negra", "Marca": "Tommy Hilfiger", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-06-22 21:25:48.254701+00', '2026-09-23 02:48:33.455139+00'),
	('4d1b8a55-3d65-45bf-8151-34d626f6e673', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Hugo', 'Hugo color negra con letras Negra/Roja', '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/cf911f93-167e-428d-a3bf-2827b2e5d918.jpg', 'disponible', 'PLA-136395', '{"Color": "Negra", "Marca": "Hugo", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:33:57.05913+00', '2026-08-18 02:01:03.941163+00'),
	('24d94f5a-69ca-4410-9914-5257280d2ef8', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Amiri', 'Letras Amiri derritiéndose ', '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/4eb9d49d-2815-442c-84c1-eb545736720a.jpeg', 'disponible', 'PLA-718158', '{"Color": "Blanca", "Marca": "Amiri", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-05-29 20:41:37.277627+00', '2026-08-18 01:57:18.779317+00'),
	('a807fdca-a58c-415c-ac42-cfe4b6fabfa7', '00000000-0000-0000-0000-000000000001', 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'McQueen', NULL, '229eb7bd-ec6b-451f-851d-65e80c987268', 200.00, 115.00, 2, 5, 'https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev/productos/15f6150e-07f5-4c23-9cde-d8b8a20534a2.jpg', 'disponible', 'PLA-356102', '{"Color": "Negra", "Marca": "McQueen", "Talla": "S, M y L", "Tipo de tela": "Algodon"}', '2026-08-08 05:28:40.00476+00', '2026-08-18 02:01:24.621027+00');


--
-- Data for Name: producto_variantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."producto_variantes" ("id", "business_id", "producto_id", "nombre", "sku", "atributos", "stock", "stock_minimo", "estatus", "created_at", "updated_at") VALUES
	('593c6149-c798-4040-95e2-ff2972757a95', '00000000-0000-0000-0000-000000000001', '50fb06ca-e1e2-4c56-816c-da9cda42b4ab', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-06-30 02:38:38.089576+00', '2026-06-30 02:38:38.089576+00'),
	('e468b7e0-0e7f-43fd-b058-867f9986e5da', '00000000-0000-0000-0000-000000000001', '50fb06ca-e1e2-4c56-816c-da9cda42b4ab', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-06-30 02:38:38.089576+00', '2026-06-30 02:38:38.089576+00'),
	('95f9f2fe-0598-475c-b34b-885ae33afd0b', '00000000-0000-0000-0000-000000000001', '50fb06ca-e1e2-4c56-816c-da9cda42b4ab', 'Extra Grande', NULL, '{"Talla": "Extra Grande"}', 1, 1, 'disponible', '2026-06-30 02:38:38.089576+00', '2026-06-30 02:38:38.089576+00'),
	('efb96084-03e7-43f0-8b02-d22481817979', '00000000-0000-0000-0000-000000000001', '1646d064-9a0d-421d-9fb2-5bfb905c7cae', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-06-30 02:43:46.818938+00', '2026-06-30 02:43:46.818938+00'),
	('8a14113e-ada8-4457-a7b4-748db69f8236', '00000000-0000-0000-0000-000000000001', '1646d064-9a0d-421d-9fb2-5bfb905c7cae', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-06-30 02:43:46.818938+00', '2026-06-30 02:43:46.818938+00'),
	('a7eb93df-cd56-4045-93ce-dcb94d448fc8', '00000000-0000-0000-0000-000000000001', '1646d064-9a0d-421d-9fb2-5bfb905c7cae', 'Grande', NULL, '{"Talla": "Grande"}', 0, 1, 'agotado', '2026-06-30 02:43:46.818938+00', '2026-06-30 02:43:46.818938+00'),
	('e6e10b47-be56-4923-aee7-5e80519aa93c', '00000000-0000-0000-0000-000000000001', '942cbce5-5042-40cb-a0a6-d74b38457a28', 'Chica', NULL, '{"Talla": "Chica"}', 1, 1, 'disponible', '2026-07-30 04:42:02.664648+00', '2026-07-30 04:42:02.664648+00'),
	('08b8a87c-4157-46bd-a666-ed02c5412a39', '00000000-0000-0000-0000-000000000001', '942cbce5-5042-40cb-a0a6-d74b38457a28', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-07-30 04:42:02.664648+00', '2026-07-30 04:42:02.664648+00'),
	('602931b6-2208-49ad-bc2c-8abbd228e25a', '00000000-0000-0000-0000-000000000001', '942cbce5-5042-40cb-a0a6-d74b38457a28', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-07-30 04:42:02.664648+00', '2026-07-30 04:42:02.664648+00'),
	('e8d43325-fa9f-449b-92a7-330e84d64004', '00000000-0000-0000-0000-000000000001', 'ea6357eb-6368-41b3-8780-3c5bf90e91ea', 'Chica', NULL, '{"Talla": "Chica"}', 1, 1, 'disponible', '2026-07-30 04:42:26.571663+00', '2026-07-30 04:42:26.571663+00'),
	('238f91e2-1478-41a4-a19c-78e0fe75b9b9', '00000000-0000-0000-0000-000000000001', 'ea6357eb-6368-41b3-8780-3c5bf90e91ea', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-07-30 04:42:26.571663+00', '2026-07-30 04:42:26.571663+00'),
	('0483328f-9e28-4b1a-8279-150ec6acbb75', '00000000-0000-0000-0000-000000000001', 'ea6357eb-6368-41b3-8780-3c5bf90e91ea', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-07-30 04:42:26.571663+00', '2026-07-30 04:42:26.571663+00'),
	('2d2dd27b-1a72-43dd-ad7f-986a55182d2c', '00000000-0000-0000-0000-000000000001', '0b4b6aa5-27c4-40f7-9333-79984061f1a7', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-06-30 02:46:10.42329+00', '2026-06-30 02:46:10.42329+00'),
	('7c6ce893-bea7-403f-beb5-158197037d39', '00000000-0000-0000-0000-000000000001', '0b4b6aa5-27c4-40f7-9333-79984061f1a7', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-06-30 02:46:10.42329+00', '2026-06-30 02:46:10.42329+00'),
	('e61f94ca-f24a-4aa9-9eb2-93546ff3bfc5', '00000000-0000-0000-0000-000000000001', '0b4b6aa5-27c4-40f7-9333-79984061f1a7', 'Mediana', NULL, '{"Talla": "Mediana"}', 0, 1, 'agotado', '2026-06-30 02:46:10.42329+00', '2026-06-30 02:46:10.42329+00'),
	('3db0daa7-4241-4585-90e6-a5f24b4dcdcd', '00000000-0000-0000-0000-000000000001', '50fb06ca-e1e2-4c56-816c-da9cda42b4ab', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-06-30 02:38:38.089576+00', '2026-07-14 03:38:46.957816+00'),
	('84611f0e-10d3-4f30-8254-72c6922d9047', '00000000-0000-0000-0000-000000000001', 'f09ff7ea-c59b-40d8-8598-b364e4355ecd', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-06-22 21:18:21.018308+00', '2026-06-22 21:18:21.018308+00'),
	('c344d45c-8713-49bc-9b5a-79bff2c2f2d6', '00000000-0000-0000-0000-000000000001', 'f09ff7ea-c59b-40d8-8598-b364e4355ecd', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-06-22 21:18:21.018308+00', '2026-06-22 21:18:21.018308+00'),
	('bd8a96a6-a668-40b9-af67-3789725d95a9', '00000000-0000-0000-0000-000000000001', 'f09ff7ea-c59b-40d8-8598-b364e4355ecd', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-06-22 21:18:21.018308+00', '2026-06-22 21:18:21.018308+00'),
	('54fd5438-14b5-44c2-9e5a-6305d5d1c3c2', '00000000-0000-0000-0000-000000000001', 'f3b9ef56-29bd-4287-84e2-7f4422aa5b40', 'Mediana', NULL, '{"Talla": "Mediana"}', 0, 1, 'agotado', '2026-06-22 21:18:42.803401+00', '2026-06-22 21:18:42.803401+00'),
	('afd82875-6290-4a8a-84ef-c331ad618601', '00000000-0000-0000-0000-000000000001', '55990f85-faf8-49af-836a-21445a8cdc9d', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-07-25 17:32:59.09465+00', '2026-07-25 17:32:59.09465+00'),
	('6854462e-f5f8-4350-bd33-0e33d53838a3', '00000000-0000-0000-0000-000000000001', '55990f85-faf8-49af-836a-21445a8cdc9d', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-07-25 17:32:59.09465+00', '2026-07-25 17:32:59.09465+00'),
	('bdb390e6-8dc8-45a6-b16e-a1ee19e9a0cc', '00000000-0000-0000-0000-000000000001', '55990f85-faf8-49af-836a-21445a8cdc9d', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-07-25 17:32:59.09465+00', '2026-07-25 17:32:59.09465+00'),
	('ba9ddabc-b641-4b5a-a6cc-005ae8de1a92', '00000000-0000-0000-0000-000000000001', '50de88f7-cead-4013-8d4c-be1cb866a526', 'Mediana', NULL, '{"Talla": "Mediana"}', 0, 1, 'agotado', '2026-07-25 17:33:38.733536+00', '2026-07-25 17:33:38.733536+00'),
	('d29e79f7-67c3-4c8d-8fca-72ea1fcd13b6', '00000000-0000-0000-0000-000000000001', '5bfb86d1-bee9-410e-8f98-fc715cffb665', 'Chica', NULL, '{"Talla": "Chica"}', 1, 1, 'disponible', '2026-07-28 22:36:28.910732+00', '2026-07-28 22:36:28.910732+00'),
	('cb69a7d3-d6b4-44da-938a-1176d4519c99', '00000000-0000-0000-0000-000000000001', '5bfb86d1-bee9-410e-8f98-fc715cffb665', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-07-28 22:36:28.910732+00', '2026-07-28 22:36:28.910732+00'),
	('34d71c76-116d-44c9-9278-1df1466b67e3', '00000000-0000-0000-0000-000000000001', '5bfb86d1-bee9-410e-8f98-fc715cffb665', 'Mediana', NULL, '{"Talla": "Mediana"}', 0, 1, 'agotado', '2026-07-28 22:36:28.910732+00', '2026-07-28 22:36:28.910732+00'),
	('981057b1-21a6-49b3-92f4-5179ae29e052', '00000000-0000-0000-0000-000000000001', 'b8bcc7b5-f5e7-4aa4-b98b-86508aaec15d', 'Chica', NULL, '{"Talla": "Chica"}', 1, 1, 'disponible', '2026-07-30 04:20:56.913733+00', '2026-07-30 04:20:56.913733+00'),
	('9a285b6c-4b06-4de2-8bc9-13e6b51af70e', '00000000-0000-0000-0000-000000000001', 'b8bcc7b5-f5e7-4aa4-b98b-86508aaec15d', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-07-30 04:20:56.913733+00', '2026-07-30 04:20:56.913733+00'),
	('d62a0fc3-05f8-4f3d-88f3-efd8f333f49a', '00000000-0000-0000-0000-000000000001', 'b8bcc7b5-f5e7-4aa4-b98b-86508aaec15d', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-07-30 04:20:56.913733+00', '2026-07-30 04:20:56.913733+00'),
	('5449b401-be77-4563-9979-ec1de6ac0850', '00000000-0000-0000-0000-000000000001', 'd9a8baa0-0493-44e9-816b-95981c073b94', 'Chica', NULL, '{"Talla": "Chica"}', 1, 1, 'disponible', '2026-08-08 05:30:08.909986+00', '2026-08-08 05:30:08.909986+00'),
	('16156d47-ebf9-4ae8-8b37-df25cd20b9f8', '00000000-0000-0000-0000-000000000001', 'd9a8baa0-0493-44e9-816b-95981c073b94', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-08-08 05:30:08.909986+00', '2026-08-08 05:30:08.909986+00'),
	('bf7299c4-3e4c-463a-b96a-53069a381639', '00000000-0000-0000-0000-000000000001', 'd9a8baa0-0493-44e9-816b-95981c073b94', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-08-08 05:30:08.909986+00', '2026-08-08 05:30:08.909986+00'),
	('30ba2a32-c6fa-4cab-ab19-a7c11d574931', '00000000-0000-0000-0000-000000000001', '24d94f5a-69ca-4410-9914-5257280d2ef8', 'Chica', NULL, '{"Talla": "Chica"}', 1, 1, 'disponible', '2026-08-18 01:57:19.340833+00', '2026-08-18 01:57:19.340833+00'),
	('88ec9cd3-254d-4f5a-8e40-31eb26dc5e91', '00000000-0000-0000-0000-000000000001', '24d94f5a-69ca-4410-9914-5257280d2ef8', 'Grande', NULL, '{"Talla": "Grande"}', 0, 1, 'agotado', '2026-08-18 01:57:19.340833+00', '2026-08-18 01:57:19.340833+00'),
	('b239d5b6-3f8c-41ba-87ba-adfcebf8ff76', '00000000-0000-0000-0000-000000000001', '24d94f5a-69ca-4410-9914-5257280d2ef8', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-08-18 01:57:19.340833+00', '2026-08-18 01:57:19.340833+00'),
	('c547bc44-edd4-49ef-b029-e06122d65966', '00000000-0000-0000-0000-000000000001', 'e91469ce-1f56-4e9a-a246-ec113b576a17', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-08-18 02:00:32.294528+00', '2026-08-18 02:00:32.294528+00'),
	('4fea0667-4ccb-40bf-9d48-995ead23b5e8', '00000000-0000-0000-0000-000000000001', 'e91469ce-1f56-4e9a-a246-ec113b576a17', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-08-18 02:00:32.294528+00', '2026-08-18 02:00:32.294528+00'),
	('fd60a04f-55a7-46ce-8f73-b1de9186dd0e', '00000000-0000-0000-0000-000000000001', 'e91469ce-1f56-4e9a-a246-ec113b576a17', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-08-18 02:00:32.294528+00', '2026-08-18 02:00:32.294528+00'),
	('70f492dc-99ba-46b2-be5d-76f6b5081c88', '00000000-0000-0000-0000-000000000001', '4d1b8a55-3d65-45bf-8151-34d626f6e673', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-08-18 02:01:04.185584+00', '2026-08-18 02:01:04.185584+00'),
	('660f3f4a-461b-450c-9385-94aea600e64e', '00000000-0000-0000-0000-000000000001', '4d1b8a55-3d65-45bf-8151-34d626f6e673', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-08-18 02:01:04.185584+00', '2026-08-18 02:01:04.185584+00'),
	('1c40d8c7-a571-4e7c-99a0-10f7e36e9061', '00000000-0000-0000-0000-000000000001', '4d1b8a55-3d65-45bf-8151-34d626f6e673', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-08-18 02:01:04.185584+00', '2026-08-18 02:01:04.185584+00'),
	('de06aa0a-bde0-4f4f-92c5-45a608cf9258', '00000000-0000-0000-0000-000000000001', 'a807fdca-a58c-415c-ac42-cfe4b6fabfa7', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-08-18 02:01:24.841929+00', '2026-08-18 02:01:24.841929+00'),
	('2bf0e9f7-78d2-4433-9f37-8a0fbba3f08f', '00000000-0000-0000-0000-000000000001', 'a807fdca-a58c-415c-ac42-cfe4b6fabfa7', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-08-18 02:01:24.841929+00', '2026-08-18 02:01:24.841929+00'),
	('c5bad455-be17-44f8-a6dc-ec453d521ebe', '00000000-0000-0000-0000-000000000001', 'a807fdca-a58c-415c-ac42-cfe4b6fabfa7', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-08-18 02:01:24.841929+00', '2026-08-18 02:01:24.841929+00'),
	('ec4284a8-b7e9-44b0-94c9-2d700d909c97', '00000000-0000-0000-0000-000000000001', '9beaf4b9-a35d-4d03-8bc7-13fa758669c9', 'Chica', NULL, '{"Talla": "Chica"}', 1, 1, 'disponible', '2026-08-18 02:02:08.989294+00', '2026-08-18 02:02:08.989294+00'),
	('ecd6e125-697a-4ba0-8a40-5f5f10ee0000', '00000000-0000-0000-0000-000000000001', '9beaf4b9-a35d-4d03-8bc7-13fa758669c9', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-08-18 02:02:08.989294+00', '2026-08-18 02:02:08.989294+00'),
	('29e4321d-67ad-4ee3-b39e-3b1f55b2cd33', '00000000-0000-0000-0000-000000000001', '9beaf4b9-a35d-4d03-8bc7-13fa758669c9', 'Mediana', NULL, '{"Talla": "Mediana"}', 0, 1, 'agotado', '2026-08-18 02:02:08.989294+00', '2026-08-18 02:02:08.989294+00'),
	('dde90c20-118b-47ad-a432-03f79d79305c', '00000000-0000-0000-0000-000000000001', 'fa841709-0365-48c8-a315-33b0beee2bfc', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-09-23 02:44:02.693833+00', '2026-09-23 02:44:02.693833+00'),
	('385af1a5-e627-49a3-9d4b-8786779bd95c', '00000000-0000-0000-0000-000000000001', 'fa841709-0365-48c8-a315-33b0beee2bfc', 'Extra Grande', NULL, '{"Talla": "Extra Grande"}', 1, 1, 'disponible', '2026-09-23 02:44:02.693833+00', '2026-09-23 02:44:02.693833+00'),
	('ad4fdc9d-9dad-4c19-9053-7366c99d1316', '00000000-0000-0000-0000-000000000001', 'fa841709-0365-48c8-a315-33b0beee2bfc', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-09-23 02:44:02.693833+00', '2026-09-23 02:44:02.693833+00'),
	('baf6d1dd-48e8-4d0d-85e6-836dc0c00be4', '00000000-0000-0000-0000-000000000001', 'fa841709-0365-48c8-a315-33b0beee2bfc', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-09-23 02:44:02.693833+00', '2026-09-23 02:44:02.693833+00'),
	('f490ee20-320c-4c3c-acc7-98ff29a3df35', '00000000-0000-0000-0000-000000000001', 'c1e39929-270d-489b-86df-7cd49f658748', 'Chica', NULL, '{"Talla": "Chica"}', 0, 1, 'agotado', '2026-09-23 02:48:34.066369+00', '2026-09-23 02:48:34.066369+00'),
	('39996b8c-b98d-41d5-86ea-d03e3247df7e', '00000000-0000-0000-0000-000000000001', 'c1e39929-270d-489b-86df-7cd49f658748', 'Grande', NULL, '{"Talla": "Grande"}', 1, 1, 'disponible', '2026-09-23 02:48:34.066369+00', '2026-09-23 02:48:34.066369+00'),
	('503803e8-950c-496d-9448-7d214f639221', '00000000-0000-0000-0000-000000000001', 'c1e39929-270d-489b-86df-7cd49f658748', 'Mediana', NULL, '{"Talla": "Mediana"}', 1, 1, 'disponible', '2026-09-23 02:48:34.066369+00', '2026-09-23 02:48:34.066369+00');


--
-- Data for Name: movimientos_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."movimientos_stock" ("id", "business_id", "producto_id", "variante_id", "user_id", "tipo", "cantidad", "stock_antes", "stock_despues", "notas", "referencia_tipo", "referencia_id", "created_at") VALUES
	('6d5d58c0-f55a-4b99-9aae-49873c2c7ad9', '00000000-0000-0000-0000-000000000001', '50fb06ca-e1e2-4c56-816c-da9cda42b4ab', '3db0daa7-4241-4585-90e6-a5f24b4dcdcd', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'venta', 1, 5, 4, NULL, 'venta', '544b2018-f439-436c-a0eb-9bfe0072eb39', '2026-07-14 03:38:47.195651+00'),
	('bba61f64-36a5-4ad6-a1c2-e4902774cba6', '00000000-0000-0000-0000-000000000001', 'a807fdca-a58c-415c-ac42-cfe4b6fabfa7', NULL, 'b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'entrada', 1, 1, 2, NULL, NULL, NULL, '2026-08-10 03:22:35.016492+00');


--
-- Data for Name: perfiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."perfiles" ("id", "nombre", "empresa", "logo_url", "plan", "created_at", "updated_at") VALUES
	('b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'Adrian', NULL, NULL, 'free', '2026-05-29 01:24:26.397471+00', '2026-05-29 01:24:26.397471+00'),
	('cd9769ae-93e9-4632-9138-32955c791a8e', 'Kevin', NULL, NULL, 'free', '2026-05-29 01:24:27.115866+00', '2026-05-29 01:24:27.115866+00'),
	('9dc37331-c923-49f6-9b95-ee808f22c90a', 'Cristopher', NULL, NULL, 'free', '2026-05-29 15:02:30.081996+00', '2026-05-29 15:02:30.081996+00'),
	('b5d7d7c4-f9fb-47b4-bee0-7a6b83b7b54f', 'Diego', NULL, NULL, 'free', '2026-05-29 15:02:30.729406+00', '2026-05-29 15:02:30.729406+00');


--
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ventas" ("id", "business_id", "user_id", "folio", "fecha", "hora", "subtotal", "descuento", "total", "monto_pagado", "saldo_pendiente", "forma_pago_inicial", "estado_pago", "estatus", "cliente_nombre", "cliente_telefono", "notas", "cancelada_at", "cancelada_por", "motivo_cancelacion", "created_at", "updated_at") VALUES
	('544b2018-f439-436c-a0eb-9bfe0072eb39', '00000000-0000-0000-0000-000000000001', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 'VNT-000001', '2026-07-14', '03:38:46', 200.00, 0.00, 200.00, 200.00, 0.00, 'efectivo', 'pagada', 'activa', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-14 03:38:45.974972+00', '2026-07-14 03:38:45.974972+00');


--
-- Data for Name: venta_pagos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."venta_pagos" ("id", "business_id", "venta_id", "user_id", "monto", "forma_pago", "notas", "created_at") VALUES
	('9e3c3471-7f8d-4dfe-b011-0b991c94fa5c', '00000000-0000-0000-0000-000000000001', '544b2018-f439-436c-a0eb-9bfe0072eb39', 'b6ae86c9-7b2f-4a56-8d12-f2cfcbb28257', 200.00, 'efectivo', NULL, '2026-07-14 03:38:46.198079+00');


--
-- Data for Name: transacciones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: venta_lineas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."venta_lineas" ("id", "business_id", "venta_id", "producto_id", "variante_id", "producto_nombre", "variante_nombre", "cantidad", "precio_unitario", "subtotal", "created_at") VALUES
	('06a95d4a-a78e-4a1f-9e07-586918a3815c', '00000000-0000-0000-0000-000000000001', '544b2018-f439-436c-a0eb-9bfe0072eb39', '50fb06ca-e1e2-4c56-816c-da9cda42b4ab', '3db0daa7-4241-4585-90e6-a5f24b4dcdcd', 'Palm Angels ', 'Chica', 1, 200.00, 200.00, '2026-07-14 03:38:46.08549+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: bucket_lifecycle_states; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: lifecycle_abandoned_artifacts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 181, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict juYTvbpBkkK7uk1ugNueW00jshTiBBsI7ARJIVdKtRjuQnopwwtexat9YcUrgZM

RESET ALL;
