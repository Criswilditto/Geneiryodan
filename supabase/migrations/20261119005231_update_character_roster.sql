/*
# Update character roster to new SSR/SR list

## Overview
Replaces the entire character roster with the user's updated list of 30 characters.
- Rarity values changed from "5-Star"/"4-Star" to "SSR"/"SR".
- Element and class columns are kept in the table (per data-safety rules) but set to empty strings — they are no longer used.
- Weapon column also set to empty string since the user is simplifying the display.
- All existing character rows are deleted (cascade removes old assignments) and replaced with the new 30.

## Characters
SSR (20): Estia, Melascula, Ban, Clotho, Daisy, Derieri, Diane, Drake, Elaine, Elizabeth, Escanor, Gowther, Güila, Jericho, Khala, King, Lancelot, Meliodas, Merlin, Mannie
SR (10): Bug, Dredrin, Dreyfus, Gilthunder, Griamore, Hendrickson, Howzer, Slater, Tioreh, Tristan

## Security
No security changes — existing RLS policies and grants remain in place.
*/

DELETE FROM character_assignments;
DELETE FROM characters;

INSERT INTO characters (id, name, rarity, element, weapon, class) VALUES
  ('b0000000-0000-0000-0000-000000000001','Estia','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000002','Melascula','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000003','Ban','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000004','Clotho','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000005','Daisy','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000006','Derieri','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000007','Diane','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000008','Drake','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000009','Elaine','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000010','Elizabeth','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000011','Escanor','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000012','Gowther','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000013','Güila','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000014','Jericho','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000015','Khala','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000016','King','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000017','Lancelot','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000018','Meliodas','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000019','Merlin','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000020','Mannie','SSR','','',''),
  ('b0000000-0000-0000-0000-000000000021','Bug','SR','','',''),
  ('b0000000-0000-0000-0000-000000000022','Dredrin','SR','','',''),
  ('b0000000-0000-0000-0000-000000000023','Dreyfus','SR','','',''),
  ('b0000000-0000-0000-0000-000000000024','Gilthunder','SR','','',''),
  ('b0000000-0000-0000-0000-000000000025','Griamore','SR','','',''),
  ('b0000000-0000-0000-0000-000000000026','Hendrickson','SR','','',''),
  ('b0000000-0000-0000-0000-000000000027','Howzer','SR','','',''),
  ('b0000000-0000-0000-0000-000000000028','Slater','SR','','',''),
  ('b0000000-0000-0000-0000-000000000029','Tioreh','SR','','',''),
  ('b0000000-0000-0000-0000-000000000030','Tristan','SR','','','');
