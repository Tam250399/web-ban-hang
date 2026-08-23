--
-- PostgreSQL database dump
--

-- Dumped from database version 16.15
-- Dumped by pg_dump version 17.5

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
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Users" ("Id", "Username", "PasswordHash", "FullName", "Email", "PhoneNumber", "RoleId", "CreatedAt") VALUES (1, 'admin', '100000.z4d6F+uCWD1yqRPzzXG+PA==.cwiDOz7HXoKUa7MxyzKJKj8C3j4DAEPBPzmFJIexqak=', 'Quản trị viên', NULL, NULL, 1, '2024-01-01 00:00:00+00');
INSERT INTO public."Users" ("Id", "Username", "PasswordHash", "FullName", "Email", "PhoneNumber", "RoleId", "CreatedAt") VALUES (2, 'tamnc12', '100000.eKbj2kMh+XuP6PdYrBMgvA==.bajG6WG0Z06zDgVn1/zh7zaFNPYELXX9t/8LHg0aiRo=', 'Tâm', '', '', 2, '2026-08-23 11:53:48.323969+00');


--
-- Name: Users_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_Id_seq"', 2, true);


--
-- PostgreSQL database dump complete
--

