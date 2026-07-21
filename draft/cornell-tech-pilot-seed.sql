-- Cornell Tech campus pilot sites, real named spaces from Cornell Tech's own campus materials.
-- Coordinates are approximate (centered on the known campus footprint at 2 West Loop Rd,
-- Roosevelt Island), since no public dataset gives per-space coordinates for these.
-- Framing note for the proposal: these are real campus open spaces, not officially
-- zoning-designated POPS under NYC's Department of City Planning dataset (confirmed there
-- are zero registered POPS on Roosevelt Island). They're a legitimate, accessible pilot
-- environment for testing the method before scaling to the 392 real Manhattan POPS.

insert into pops (name, description, lat, lng, amenities, best_time, hours, status) values
('Campus Plaza', 'The multi-use central gathering space at the heart of campus, built to host larger events.', 40.7550, -73.9598, array['seating','wifi','sun'], 'Weekday mornings, before the campus fills up', '7am to 9:30pm daily', 'active'),
('Tech Walk', 'The quarter-mile central spine connecting active and social spaces across campus.', 40.7555, -73.9600, array['seating','shade'], 'Midday, when the walk is liveliest', '7am to 9:30pm daily', 'active'),
('Campus Lawn', 'Open lawn with pockets of green space between buildings, framed by NYC and river views.', 40.7560, -73.9603, array['sun','armchair'], 'Late afternoon, for the light and the view', '7am to 9:30pm daily', 'active'),
('Waterfront Promenade', 'A riverwalk along the water frontage, connecting campus to the rest of Roosevelt Island.', 40.7548, -73.9593, array['scenic','armchair'], 'Early evening, as the water catches the light', '7am to 9:30pm daily', 'active'),
('Bloomberg Cafe', 'The sunny cafe inside the Bloomberg Center, an indoor gathering and work space.', 40.7553, -73.9605, array['wifi','plug','food'], 'Weekday mornings for a quiet coffee, midday for company', '7am to 9:30pm daily', 'active');
