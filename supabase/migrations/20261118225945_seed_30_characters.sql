/*
# Seed 30 7DS Origin Characters

Seeds the shared character roster with 30 characters from
The Seven Deadly Sins: Origin. Uses explicit UUIDs so re-running
the migration is idempotent.
*/

INSERT INTO characters (id, name, rarity, element, weapon, class) VALUES
  ('a0000000-0000-0000-0000-000000000001','Meliodas','5-Star','Dark','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000002','Diane','5-Star','Earth','Hammer','DPS'),
  ('a0000000-0000-0000-0000-000000000003','King','5-Star','Wind','Chastiefol','Support'),
  ('a0000000-0000-0000-0000-000000000004','Elaine','5-Star','Wind','Wand','Healer'),
  ('a0000000-0000-0000-0000-000000000005','Jericho','5-Star','Ice','Dual Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000006','Guila','5-Star','Fire','Bomb','DPS'),
  ('a0000000-0000-0000-0000-000000000007','Drake','5-Star','Water','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000008','Mannie','5-Star','Light','Wand','Support'),
  ('a0000000-0000-0000-0000-000000000009','Daisy','5-Star','Light','Wand','Healer'),
  ('a0000000-0000-0000-0000-000000000010','Tioreh','4-Star','Fire','Wand','Healer'),
  ('a0000000-0000-0000-0000-000000000011','Tristan','4-Star','Light','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000012','Gilthunder','4-Star','Lightning','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000013','Slater','4-Star','Earth','Sword','Tank'),
  ('a0000000-0000-0000-0000-000000000014','Howzer','4-Star','Wind','Spear','DPS'),
  ('a0000000-0000-0000-0000-000000000015','Dredrin','4-Star','Dark','Grimoire','Support'),
  ('a0000000-0000-0000-0000-000000000016','Bug','4-Star','Dark','Grimoire','Support'),
  ('a0000000-0000-0000-0000-000000000017','Dreyfus','4-Star','Earth','Sword','Tank'),
  ('a0000000-0000-0000-0000-000000000018','Hendrickson','4-Star','Dark','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000019','Griamore','4-Star','Earth','Shield','Tank'),
  ('a0000000-0000-0000-0000-000000000020','Ban','5-Star','Dark','Staff','DPS'),
  ('a0000000-0000-0000-0000-000000000021','Merlin','5-Star','Dark','Wand','Support'),
  ('a0000000-0000-0000-0000-000000000022','Escanor','5-Star','Fire','Axe','DPS'),
  ('a0000000-0000-0000-0000-000000000023','Gowther','5-Star','Mind','Grimoire','Support'),
  ('a0000000-0000-0000-0000-000000000024','Melascula','4-Star','Dark','Wand','Support'),
  ('a0000000-0000-0000-0000-000000000025','Zeltris','4-Star','Dark','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000026','Gala','4-Star','Fire','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000027','Estia','4-Star','Water','Wand','Healer'),
  ('a0000000-0000-0000-0000-000000000028','Arthur','5-Star','Light','Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000029','Cusack','4-Star','Dark','Dual Sword','DPS'),
  ('a0000000-0000-0000-0000-000000000030','Chandler','4-Star','Dark','Wand','Support')
ON CONFLICT (id) DO NOTHING;
