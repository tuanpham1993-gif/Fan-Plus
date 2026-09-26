-- Seed Data for Fan Hub Plus Database
USE `fan_hub_plus`;

-- Roles
INSERT INTO `roles` (`id`, `name`) VALUES 
(1, 'Admin'),
(2, 'User');

-- Users (Passwords are hashed with Werkzeug pbkdf2 or bcrypt, defaults: admin123 / user123)
-- Admin: admin / admin@fanhub.com (password: admin123)
-- User: user / user@fanhub.com (password: user123)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `avatar`, `bio`, `role_id`) VALUES
(1, 'admin', 'admin@fanhub.com', 'scrypt:32768:8:1$7DkL3mK4a0vJ$788b77622668b556f0e9fca2fce12d8a4e287bf62c6ad228b3ef77ef1572c6cfb4a0f44bb5db3e477e38eb45d2f6fb39f60f6ea317c805eb3ab98d8ed27fbf66', 'Administrator', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', 'Official Admin of Fan Hub Plus Universe.', 1),
(2, 'otaku_master', 'user@fanhub.com', 'scrypt:32768:8:1$8EkL4mK5a1vK$899c88733779c667g1f0gdb3gde23e9b5f398cg73d7be339c4fg88fg2683d7dgc5b1g55cc6ec4f588f49fc56e3g7gc40g71g7fb428d906fc4bc99e9fe38gcg77', 'Tuấn Phạm (Super Fan)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', 'Passionate anime, manga and gaming enthusiast since 2012.', 2),
(3, 'cyber_sakura', 'sakura@fanhub.com', 'scrypt:32768:8:1$7DkL3mK4a0vJ$788b77622668b556f0e9fca2fce12d8a4e287bf62c6ad228b3ef77ef1572c6cfb4a0f44bb5db3e477e38eb45d2f6fb39f60f6ea317c805eb3ab98d8ed27fbf66', 'Hòa Nguyễn', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300', 'Cosplayer & Cyberpunk Fandom creator.', 2);

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`) VALUES
(1, 'Anime & Manga', 'anime-manga', 'Deep dives into popular anime series, manga reviews, and theory breakdowns.', 'Tv'),
(2, 'Gaming & Esports', 'gaming-esports', 'Highlights, lore analysis, walkthroughs, and competitive esports stories.', 'Gamepad2'),
(3, 'Cosplay & Craft', 'cosplay-craft', 'Stunning cosplay showcases, tutorial guides, and crafting breakdowns.', 'Sparkles'),
(4, 'Fan Art & Creative', 'fan-art-creative', 'Original fan artwork, digital paintings, and creative illustrations.', 'Palette'),
(5, 'Movie & Cinematic', 'movie-cinematic', 'Cinematic universes, superhero sagas, and movie reviews.', 'Film');

-- Characters
INSERT INTO `characters` (`id`, `name`, `anime_fandom`, `role_type`, `bio`, `avatar`, `banner`) VALUES
(1, 'Goku (Son Goku)', 'Dragon Ball Z / Super', 'Protagonist', 'The legendary Saiyan warrior protecting Universe 7 through martial arts mastery.', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200'),
(2, 'Levi Ackerman', 'Attack on Titan', 'Captain', 'Humanity\'s strongest soldier and squad captain in the Special Operations Squad.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200'),
(3, 'Jinx', 'Arcane / League of Legends', 'Anti-Hero', 'A chaotic Zaunite inventor with a flare for explosives and unpredictable flair.', 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200');

-- Contents
INSERT INTO `contents` (`id`, `title`, `slug`, `summary`, `content`, `cover_image`, `category_id`, `character_id`, `author_id`, `view_count`, `featured`, `tags`) VALUES
(1, 'Attack on Titan Season 4 Final Part: Detailed Plot & Ending Analysis', 'attack-on-titan-season-4-analysis', 'An in-depth breakdown of Hajime Isayama\'s masterpiece finale, character arcs, and thematic brilliance.', 'Attack on Titan (Shingeki no Kyojin) has concluded its epic saga. In this comprehensive review, we dive deep into Eren Yeager\'s controversial choices, Levi Ackerman\'s tragic sacrifices, and the moral ambiguity of freedom. Isayama masterfully weaves themes of hatred, legacy, and hope into the final battle of Fort Salta.', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800', 1, 2, 1, 1420, 1, 'Anime,Review,AOT,Levi'),
(2, 'Arcane Season 2: What Lies Ahead for Jinx and Vi in Piltover & Zaun', 'arcane-season-2-preview-jinx-vi', 'Exploring the tragic dynamic between the sisters and what to expect from Riot Games and Fortiche.', 'Following the explosive climax of Arcane Season 1, the conflict between Piltover and Zaun reaches boiling point. Jinx\'s transformation into the chaotic symbol of the undercity sets up an irreversible collision course with Vi and Enforcer Caitlyn. We break down teaser clues, hextech evolution, and new champion cameos.', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 1, 3, 2, 980, 1, 'Arcane,Jinx,Gaming,LoL'),
(3, 'Mastering Cosplay Armor Crafting with EVA Foam: Beginner to Pro Guide', 'cosplay-armor-crafting-eva-foam-guide', 'Step-by-step tutorial on drafting patterns, heat shaping foam, and painting realistic metallic weathering.', 'Crafting lightweight yet durable armor is the Holy Grail of cosplay. In this step-by-step masterclass, we cover essential tools: high-density EVA foam, contact cement, heat gun technique, and acrylic weathering techniques. Learn how to achieve polished chrome or battle-worn steel textures effortlessly.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800', 3, NULL, 3, 650, 0, 'Cosplay,Tutorial,Crafting,DIY'),
(4, 'The Evolution of Fighting Games: From Street Fighter II to Tekken 8', 'evolution-of-fighting-games-sf-tekken', 'How mechanical innovations, rollback netcode, and competitive esports reshaped fighting game history.', 'Fighting games have evolved from arcade coin-op cabinets into global esports phenomena. With Tekken 8 and Street Fighter 6 setting historic player records, we trace 30 years of frame data, motion inputs, and netcode technology that built modern competitive communities.', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800', 2, NULL, 1, 430, 0, 'Gaming,Esports,FightingGames');

-- Bookmarks
INSERT INTO `bookmarks` (`id`, `user_id`, `content_id`) VALUES
(1, 2, 1),
(2, 2, 2);

-- Feedback
INSERT INTO `feedback` (`id`, `user_id`, `name`, `email`, `subject`, `message`, `status`) VALUES
(1, 2, 'Tuấn Phạm', 'user@fanhub.com', 'Feature Request: Dark mode enhancements', 'Loving the new Fandom universe layout! Could we get customized character badges for top commenters?', 'pending'),
(2, NULL, 'Mai Anh', 'maianh@gmail.com', 'Cosplay Event Partnership', 'We would love to sponsor the upcoming Fan Hub Plus Anime Expo 2026. Please contact us!', 'resolved');

-- Merchandise
INSERT INTO `merchandise` (`id`, `name`, `description`, `price`, `image`, `category`, `stock`, `rating`) VALUES
(1, 'Levi Ackerman 1/7 Scale PVC Figure (Final Season Ver.)', 'Ultra detailed scale figure featuring Captain Levi in full ODM gear.', 189.99, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600', 'Figures', 25, 4.9),
(2, 'Arcane Jinx Fishbones LED Replica Launcher', 'Full-scale light-up prop with sound effects and custom display stand.', 249.00, 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600', 'Props & Replicas', 10, 5.0),
(3, 'Dragon Ball Z Super Saiyan Goku Vintage Hoodie', 'Premium heavy cotton embroidered hoodie with iconic Kanji symbol.', 65.50, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600', 'Apparel', 100, 4.7);

-- Events
INSERT INTO `events` (`id`, `title`, `description`, `location`, `event_date`, `banner`, `organizer`) VALUES
(1, 'Fan Hub Expo 2026: Fandom Universe Summit', 'The largest gathering of anime fans, cosplayers, gamers, and digital creators in Southeast Asia.', 'National Convention Center, Hanoi', '15-17 October 2026', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200', 'Fan Hub Plus Team'),
(2, 'League of Legends Arcane Watch Party & Cosplay Championship', 'Exclusive screening, live orchestra performance, and 10,000 USD cosplay tournament.', 'GEM Center, Ho Chi Minh City', '05 November 2026', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200', 'Riot Games & Fan Hub');
