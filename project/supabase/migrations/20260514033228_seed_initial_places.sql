/*
  # Seed initial places dataset

  Inserts all 67 curated places across 13 French cities (plus Monaco).
  These were previously hardcoded in src/data/places.ts and are now
  persisted in the database.

  Mapping from legacy schema:
  - type food → restaurant, culture → museum, chill/view → park, social → bar
  - budget free/low → économique, mid → modéré, high → premium
  - tags → experience_type (jsonb array)
  - ver=true → discovery_level = 'lieux connus', ver=false → 'endroits cachés'
  - dur → duration (minutes)
  - score → rating_average
  - needsReservation → reservable
*/

INSERT INTO places (name, type, description, experience_type, budget, discovery_level, duration, reservable, city, rating_average, lat, lng, vid)
VALUES
-- PARIS
('Café de Flore', 'restaurant', 'Terrasse mythique du 6ème. Croissants parfaits, lumière dorée, pas trop de monde le matin.', '["date","gastronomie","chill","romantique"]', 'modéré', 'lieux connus', 90, false, 'Paris', 4.7, 48.854, 2.332, 'https://www.instagram.com/reel/example1'),
('Marché rue Mouffetard', 'restaurant', 'Le marché vivant du 5ème. Fromages, charcuterie, pain chaud. Déjeuner street food pour pas cher.', '["gastronomie","aventure","chill","nature","amis"]', 'économique', 'lieux connus', 60, false, 'Paris', 4.5, 48.844, 2.351, null),
('Bistrot Paul Bert', 'restaurant', 'Table en bois, ardoise du marché, vin nature. L''adresse que les Parisiens ne donnent qu''aux proches.', '["date","gastronomie","festif"]', 'modéré', 'lieux connus', 120, true, 'Paris', 4.8, 48.852, 2.384, null),
('Septime', 'restaurant', 'Table partagée, cuisine du marché. Réservez. L''un des meilleurs bistrots de Paris.', '["date","gastronomie","festif"]', 'premium', 'lieux connus', 120, true, 'Paris', 4.9, 48.853, 2.382, null),
('Café Oberkampf', 'restaurant', 'Hors du flux touristique. Playlists lo-fi, le meilleur flat white du quartier.', '["chill","solo","aventure"]', 'économique', 'lieux connus', 60, false, 'Paris', 4.3, 48.864, 2.374, null),
('Holybelly', 'restaurant', 'Brunch américain de folie dans le 10ème. Queue inévitable, ça vaut chaque minute.', '["chill","amis","date"]', 'économique', 'lieux connus', 90, false, 'Paris', 4.6, 48.870, 2.362, null),
('Butte Ménilmontant', 'park', 'Le meilleur panorama de Paris selon les Parisiens. Zéro touristes, coucher de soleil à couper le souffle.', '["chill","solo","date","nature","aventure","romantique"]', 'économique', 'lieux connus', 60, false, 'Paris', 4.7, 48.864, 2.397, 'https://www.tiktok.com/@paris.secrets/video/2'),
('Le Perchoir Marais', 'bar', 'Rooftop avec vue sur Paris, cocktails signés. Réservez en été.', '["date","festif","amis"]', 'modéré', 'lieux connus', 90, false, 'Paris', 4.4, 48.858, 2.362, null),
('Terrasse IMA', 'park', 'Vue sur la Seine et Notre-Dame depuis la terrasse de l''Institut du Monde Arabe. Peu connu.', '["culturel","date","solo","aventure"]', 'économique', 'lieux connus', 60, false, 'Paris', 4.5, 48.851, 2.354, null),
('Square du Vert-Galant', 'park', 'La pointe de l''île de la Cité. La Seine tout autour. Calme absolu en plein Paris.', '["date","chill","solo","romantique"]', 'économique', 'lieux connus', 45, false, 'Paris', 4.6, 48.856, 2.342, null),
('Musée de la Vie Romantique', 'museum', 'Jardin secret dans le 9ème. Maison cachée derrière des rosiers. Entrée gratuite aux collections permanentes.', '["date","culturel","romantique","solo"]', 'économique', 'lieux connus', 90, false, 'Paris', 4.5, 48.883, 2.333, null),
('Musée Bourdelle', 'museum', 'Les ateliers du sculpteur. Cour intérieure magnifique, presque toujours vide.', '["culturel","solo","chill"]', 'économique', 'endroits cachés', 75, false, 'Paris', 4.2, 48.842, 2.319, null),
('Sainte-Chapelle', 'museum', 'Les vitraux gothiques les plus époustouflants de Paris. Moins connue que Notre-Dame, bien plus belle.', '["culturel","date","aventure"]', 'économique', 'lieux connus', 60, false, 'Paris', 4.8, 48.855, 2.345, null),
('Jardin des Plantes', 'park', 'Le jardin botanique historique. Moins fréquenté que les Tuileries. Serres tropicales incluses.', '["chill","nature","solo","date"]', 'économique', 'lieux connus', 90, false, 'Paris', 4.4, 48.844, 2.359, null),
('Canal Saint-Martin', 'park', 'Les ponts en fer forgé, les péniches, les terrasses. Paris à son plus authentique.', '["date","chill","romantique","amis"]', 'économique', 'lieux connus', 60, false, 'Paris', 4.6, 48.870, 2.362, null),
('Parc des Buttes-Chaumont', 'park', 'Le parc le plus beau et le plus méconnu de Paris. Falaises, lac, temple en hauteur.', '["nature","chill","amis","solo","aventure"]', 'économique', 'lieux connus', 90, false, 'Paris', 4.7, 48.879, 2.382, null),
('Bar à vins Le Baron Rouge', 'bar', 'Fût de vin à 2€ sur le trottoir. Les Parisiens du 12ème s''y retrouvent le dimanche matin.', '["amis","festif","social"]', 'économique', 'lieux connus', 60, false, 'Paris', 4.5, 48.849, 2.379, null),
('Chez Prune', 'bar', 'Terrasse Canal Saint-Martin, bière pression, soleil. L''apéro parfait à 18h.', '["amis","festif","chill","date"]', 'économique', 'lieux connus', 75, false, 'Paris', 4.3, 48.872, 2.366, null),

-- LYON
('Marché Saint-Antoine', 'restaurant', 'Le marché des Lyonnais sur les quais de Saône. Fromages, charcuterie, bouchons ambulants.', '["gastronomie","chill","amis"]', 'économique', 'lieux connus', 75, false, 'Lyon', 4.6, 45.762, 4.831, null),
('Bouchon Chez Hugon', 'restaurant', 'L''authentique bouchon lyonnais. Quenelles, tablier de sapeur. Réservation obligatoire.', '["gastronomie","date","amis"]', 'modéré', 'lieux connus', 120, true, 'Lyon', 4.8, 45.767, 4.833, null),
('Traboules de la Croix-Rousse', 'park', 'Les passages secrets des canuts. Un labyrinthe de cours intérieures hors du temps.', '["aventure","culturel","solo","date"]', 'économique', 'lieux connus', 90, false, 'Lyon', 4.7, 45.775, 4.829, null),
('Parc de la Tête d''Or', 'park', 'Le plus grand parc urbain de France. Lac, zoo gratuit, roseraie. Idéal le matin.', '["nature","chill","amis","date"]', 'économique', 'lieux connus', 90, false, 'Lyon', 4.5, 45.778, 4.854, null),
('Esplanade de Fourvière', 'park', 'Vue à 360° sur Lyon, le Rhône, les Alpes. Coucher de soleil inoubliable.', '["date","solo","romantique","aventure"]', 'économique', 'lieux connus', 60, false, 'Lyon', 4.9, 45.762, 4.822, null),
('Musée des Confluences', 'museum', 'Architecture spectaculaire à la jonction du Rhône et de la Saône.', '["culturel","solo","date"]', 'économique', 'lieux connus', 120, true, 'Lyon', 4.4, 45.733, 4.819, null),

-- MARSEILLE
('Marché du Vieux-Port', 'restaurant', 'La pêche du matin directement sur le quai. La bouillabaisse commence ici.', '["gastronomie","aventure","chill"]', 'économique', 'lieux connus', 60, false, 'Marseille', 4.5, 43.295, 5.374, null),
('Calanque de Sugiton', 'park', '30 min à pied depuis le campus. Eau turquoise, roches blanches, silence.', '["nature","aventure","solo","amis"]', 'économique', 'lieux connus', 180, false, 'Marseille', 4.9, 43.217, 5.452, null),
('Notre-Dame de la Garde', 'park', 'La Bonne Mère veille sur Marseille. Vue 360° sur la ville et la mer.', '["culturel","date","solo","romantique"]', 'économique', 'lieux connus', 60, false, 'Marseille', 4.7, 43.284, 5.370, null),
('Le Cours Julien', 'bar', 'Le quartier bohème. Street art, cafés, bars à vins. Le vrai Marseille branché.', '["amis","festif","social","culturel"]', 'économique', 'lieux connus', 90, false, 'Marseille', 4.4, 43.291, 5.385, null),
('MuCEM', 'museum', 'Le musée des civilisations en passerelle sur la mer. Terrasse avec vue sur le fort Saint-Jean.', '["culturel","date","solo"]', 'économique', 'lieux connus', 90, true, 'Marseille', 4.6, 43.298, 5.362, null),

-- BORDEAUX
('Marché des Capucins', 'restaurant', 'Le ventre de Bordeaux. Huîtres avec vin blanc le matin, comme les locaux.', '["gastronomie","chill","amis"]', 'économique', 'lieux connus', 75, false, 'Bordeaux', 4.7, 44.836, -0.572, null),
('Darwin Éco-système', 'bar', 'Friche créative sur les quais. Street art, skate, brunch, startup. L''anti-Bordeaux.', '["social","amis","culturel","aventure"]', 'économique', 'lieux connus', 90, false, 'Bordeaux', 4.5, 44.845, -0.545, null),
('Miroir d''eau', 'park', 'Le plus grand miroir d''eau au monde. Reflets parfaits de la place de la Bourse au coucher du soleil.', '["date","romantique","solo","chill"]', 'économique', 'lieux connus', 45, false, 'Bordeaux', 4.8, 44.841, -0.569, null),
('Cité du Vin', 'museum', 'Architecture spectaculaire. La plus belle cave à vin du monde. Vue sur la Garonne depuis le belvédère.', '["gastronomie","culturel","date"]', 'modéré', 'lieux connus', 120, true, 'Bordeaux', 4.6, 44.862, -0.550, null),

-- NICE
('Cours Saleya — marché', 'restaurant', 'Fleurs et légumes du matin sous le soleil. La Méditerranée dans une assiette.', '["gastronomie","chill","amis","date"]', 'économique', 'lieux connus', 60, false, 'Nice', 4.7, 43.695, 7.276, null),
('Colline du Château', 'park', 'Vue panoramique sur la Baie des Anges et les toits de Nice. Accès gratuit, coucher de soleil magique.', '["date","romantique","solo","aventure"]', 'économique', 'lieux connus', 75, false, 'Nice', 4.8, 43.696, 7.282, null),
('Vieux-Nice — ruelles', 'park', 'Ruelles colorées, baroque, gelato, farniente. Nice authentique à 10 min du centre.', '["chill","culturel","amis","date"]', 'économique', 'lieux connus', 90, false, 'Nice', 4.6, 43.696, 7.277, null),
('Villa Arson', 'museum', 'Centre d''art contemporain caché dans un jardin suspendu. Vue sur la mer, expositions surprenantes.', '["culturel","solo","aventure"]', 'économique', 'endroits cachés', 90, false, 'Nice', 4.3, 43.714, 7.263, null),

-- TOULOUSE
('Marché Victor Hugo', 'restaurant', 'Le marché couvert des Toulousains. Cassoulet, foie gras, fromages du Sud-Ouest.', '["gastronomie","chill","amis"]', 'économique', 'lieux connus', 75, false, 'Toulouse', 4.7, 43.601, 1.444, null),
('Berges du Canal du Midi', 'park', 'Platanes centenaires, péniches, silence. La promenade la plus apaisante de Toulouse.', '["chill","nature","date","romantique","solo"]', 'économique', 'lieux connus', 90, false, 'Toulouse', 4.6, 43.596, 1.471, null),
('Les Abattoirs', 'museum', 'Musée d''art moderne dans une ancienne halle industrielle. Collections exceptionnelles.', '["culturel","solo","date"]', 'économique', 'lieux connus', 90, true, 'Toulouse', 4.4, 43.604, 1.427, null),
('Jardin des Plantes Toulouse', 'park', 'Oasis de verdure au cœur de la ville rose. Serre tropicale, fontaines, calme.', '["nature","chill","solo","date"]', 'économique', 'lieux connus', 60, false, 'Toulouse', 4.3, 43.589, 1.449, null),

-- LILLE
('Estaminet T''Fils', 'restaurant', 'Estaminet authentique du Vieux-Lille. Carbonnade flamande, welsh, bière locale.', '["gastronomie","amis","chill"]', 'économique', 'lieux connus', 90, true, 'Lille', 4.5, 50.636, 3.064, null),
('Beaux-Arts de Lille', 'museum', 'Le plus beau palais des Beaux-Arts de province. Collections impressionnistes.', '["culturel","solo","date"]', 'économique', 'lieux connus', 120, true, 'Lille', 4.6, 50.637, 3.065, null),
('Vieux-Lille — ruelles', 'park', 'Ruelles pavées, façades baroques, boutiques créatives. Le charme du Nord.', '["chill","culturel","date","amis"]', 'économique', 'lieux connus', 90, false, 'Lille', 4.4, 50.638, 3.060, null),
('La Citadelle de Lille', 'park', 'Parc Vauban autour de la citadelle. Jogging, pique-nique, zoo gratuit.', '["nature","chill","amis","solo"]', 'économique', 'lieux connus', 90, false, 'Lille', 4.3, 50.641, 3.043, null),

-- NANTES
('Les Machines de l''île', 'museum', 'L''éléphant mécanique de 12m. L''univers steampunk de Jules Verne.', '["culturel","aventure","amis","date"]', 'modéré', 'lieux connus', 120, true, 'Nantes', 4.8, 47.206, -1.559, null),
('Le Lieu Unique', 'bar', 'Ancienne usine LU devenue centre culturel. Bar, concerts, expo, brunch.', '["social","amis","culturel","festif"]', 'économique', 'lieux connus', 90, false, 'Nantes', 4.5, 47.213, -1.557, null),
('Jardin des Plantes Nantes', 'park', 'Le plus vieux jardin botanique de France. Calme, fleurs, écureuils.', '["nature","chill","solo","date"]', 'économique', 'lieux connus', 60, false, 'Nantes', 4.4, 47.218, -1.560, null),
('Passage Pommeraye', 'park', 'Galerie couverte du 19ème. Escaliers, boutiques, lumière du jour.', '["chill","culturel","date","shopping"]', 'économique', 'lieux connus', 45, false, 'Nantes', 4.3, 47.213, -1.561, null),

-- ANGERS
('Château d''Angers', 'museum', 'Tapisserie de l''Apocalypse de 140m. Forteresse noire au cœur de la ville.', '["culturel","date","solo"]', 'économique', 'lieux connus', 90, true, 'Angers', 4.6, 47.471, -0.556, null),
('Terra Botanica', 'park', 'Parc végétal interactif. Serres, jardins flottants, biodiversité.', '["nature","chill","amis","date"]', 'modéré', 'lieux connus', 180, true, 'Angers', 4.4, 47.481, -0.521, null),
('Maison d''Adam', 'park', 'La plus vieille maison d''Angers. Façade à colombages du 15ème.', '["culturel","chill","solo"]', 'économique', 'lieux connus', 30, false, 'Angers', 4.2, 47.472, -0.554, null),

-- MONACO
('Le Louis XV — Alain Ducasse', 'restaurant', 'Trois étoiles Michelin au Hôtel de Paris. Cuisine méditerranéenne d''exception.', '["gastronomie","date","romantique"]', 'premium', 'lieux connus', 180, true, 'Monaco', 4.9, 43.738, 7.425, null),
('Jardin Exotique', 'park', 'Cactus géants et vue plongeante sur la Principauté et la mer.', '["nature","view","date","solo"]', 'économique', 'lieux connus', 75, true, 'Monaco', 4.5, 43.731, 7.416, null),
('Casino de Monte-Carlo', 'bar', 'L''institution monégasque. Architecture Belle Époque, jeux, spectacles.', '["social","festif","amis"]', 'premium', 'lieux connus', 120, true, 'Monaco', 4.6, 43.739, 7.428, null),

-- STRASBOURG
('Winstub S''kaeche', 'restaurant', 'Winstub alsacien authentique. Choucroute, baeckeoffe, riesling.', '["gastronomie","amis","chill"]', 'économique', 'lieux connus', 90, true, 'Strasbourg', 4.6, 48.581, 7.747, null),
('Cathédrale de Strasbourg', 'museum', 'La plus haute cathédrale gothique de France. Horloge astronomique.', '["culturel","date","solo"]', 'économique', 'lieux connus', 60, false, 'Strasbourg', 4.8, 48.581, 7.749, null),
('La Petite France', 'park', 'Quartier des moulins et des tanneurs. Canaux, colombages, fleurs.', '["chill","culturel","date","romantique"]', 'économique', 'lieux connus', 90, false, 'Strasbourg', 4.7, 48.578, 7.744, null),
('Musée Alsacien', 'museum', 'Intérieurs alsaciens reconstitués. Costumes, traditions, vie quotidienne.', '["culturel","solo"]', 'économique', 'lieux connus', 75, true, 'Strasbourg', 4.3, 48.580, 7.748, null),

-- MONTPELLIER
('Le Petit Jardin', 'restaurant', 'Table méditerranéenne dans un patio ombragé. Produits du marché, vins du Languedoc.', '["gastronomie","date","romantique"]', 'modéré', 'lieux connus', 120, true, 'Montpellier', 4.7, 43.610, 3.876, null),
('Place de la Comédie', 'bar', 'La place emblématique. Cafés, Opéra, soleil. Le cœur battant de Montpellier.', '["social","amis","chill","festif"]', 'économique', 'lieux connus', 60, false, 'Montpellier', 4.4, 43.608, 3.879, null),
('Antigone — quartier', 'park', 'Architecture néo-grecque signée Ricardo Bofill. Promenade le long du Lez.', '["chill","culturel","solo","date"]', 'économique', 'lieux connus', 60, false, 'Montpellier', 4.2, 43.607, 3.891, null),

-- TOULON
('Cours Lafayette — marché', 'restaurant', 'Le marché provençal. Tapenade, socca, vins rosés du Var.', '["gastronomie","chill","amis"]', 'économique', 'lieux connus', 60, false, 'Toulon', 4.5, 43.126, 5.930, null),
('Mont Faron', 'park', 'Téléphérique ou route sinueuse. Vue à 360° sur la rade de Toulon.', '["view","nature","aventure","date"]', 'économique', 'lieux connus', 120, false, 'Toulon', 4.7, 43.146, 5.960, null),
('Rade de Toulon — promenade', 'park', 'La plus belle rade d''Europe. Port militaire, voiliers, lumière du soir.', '["chill","romantique","solo","date"]', 'économique', 'lieux connus', 60, false, 'Toulon', 4.5, 43.122, 5.934, null)

ON CONFLICT DO NOTHING;
