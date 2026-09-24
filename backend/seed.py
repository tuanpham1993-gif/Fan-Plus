from extensions import db
from models import Role, User, Category, Character, Content, Bookmark, Feedback, Merchandise, Event

def seed_database():
    """Seed initial data if tables are empty"""
    # 1. Roles
    if Role.query.count() == 0:
        admin_role = Role(id=1, name='Admin')
        user_role = Role(id=2, name='User')
        db.session.add_all([admin_role, user_role])
        db.session.commit()

    # 2. Users
    if User.query.count() == 0:
        admin = User(
            id=1,
            username='admin',
            email='admin@fanhub.com',
            full_name='Administrator',
            avatar='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
            bio='Official Admin of Fan Hub Plus Universe.',
            role_id=1
        )
        admin.set_password('admin123')

        user = User(
            id=2,
            username='otaku_master',
            email='user@fanhub.com',
            full_name='Tuấn Phạm (Super Fan)',
            avatar='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
            bio='Passionate anime, manga and gaming enthusiast since 2012.',
            role_id=2
        )
        user.set_password('user123')

        user2 = User(
            id=3,
            username='cyber_sakura',
            email='sakura@fanhub.com',
            full_name='Hòa Nguyễn',
            avatar='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
            bio='Cosplayer & Cyberpunk Fandom creator.',
            role_id=2
        )
        user2.set_password('user123')

        db.session.add_all([admin, user, user2])
        db.session.commit()

    # 3. Categories
    if Category.query.count() == 0:
        cats = [
            Category(id=1, name='Anime & Manga', slug='anime-manga', description='Deep dives into popular anime series, manga reviews, and theory breakdowns.', icon='Tv'),
            Category(id=2, name='Gaming & Esports', slug='gaming-esports', description='Highlights, lore analysis, walkthroughs, and competitive esports stories.', icon='Gamepad2'),
            Category(id=3, name='Cosplay & Craft', slug='cosplay-craft', description='Stunning cosplay showcases, tutorial guides, and crafting breakdowns.', icon='Sparkles'),
            Category(id=4, name='Fan Art & Creative', slug='fan-art-creative', description='Original fan artwork, digital paintings, and creative illustrations.', icon='Palette'),
            Category(id=5, name='Movie & Cinematic', slug='movie-cinematic', description='Cinematic universes, superhero sagas, and movie reviews.', icon='Film')
        ]
        db.session.add_all(cats)
        db.session.commit()

    # 4. Characters
    if Character.query.count() == 0:
        chars = [
            Character(
                id=1,
                name='Goku (Son Goku)',
                anime_fandom='Dragon Ball Z / Super',
                role_type='Protagonist',
                bio='The legendary Saiyan warrior protecting Universe 7 through martial arts mastery.',
                avatar='https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                banner='https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200'
            ),
            Character(
                id=2,
                name='Levi Ackerman',
                anime_fandom='Attack on Titan',
                role_type='Captain',
                bio='Humanity\'s strongest soldier and squad captain in the Special Operations Squad.',
                avatar='https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400',
                banner='https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200'
            ),
            Character(
                id=3,
                name='Jinx',
                anime_fandom='Arcane / League of Legends',
                role_type='Anti-Hero',
                bio='A chaotic Zaunite inventor with a flare for explosives and unpredictable flair.',
                avatar='https://images.unsplash.com/photo-1563089145-599997674d42?w=400',
                banner='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200'
            )
        ]
        db.session.add_all(chars)
        db.session.commit()

    # 5. Contents
    if Content.query.count() == 0:
        contents = [
            Content(
                id=1,
                title='Attack on Titan Season 4 Final Part: Detailed Plot & Ending Analysis',
                slug='attack-on-titan-season-4-analysis',
                summary='An in-depth breakdown of Hajime Isayama\'s masterpiece finale, character arcs, and thematic brilliance.',
                content='Attack on Titan (Shingeki no Kyojin) has concluded its epic saga. In this comprehensive review, we dive deep into Eren Yeager\'s controversial choices, Levi Ackerman\'s tragic sacrifices, and the moral ambiguity of freedom. Isayama masterfully weaves themes of hatred, legacy, and hope into the final battle of Fort Salta.',
                cover_image='https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
                category_id=1,
                character_id=2,
                author_id=1,
                view_count=1420,
                featured=True,
                tags='Anime,Review,AOT,Levi'
            ),
            Content(
                id=2,
                title='Arcane Season 2: What Lies Ahead for Jinx and Vi in Piltover & Zaun',
                slug='arcane-season-2-preview-jinx-vi',
                summary='Exploring the tragic dynamic between the sisters and what to expect from Riot Games and Fortiche.',
                content='Following the explosive climax of Arcane Season 1, the conflict between Piltover and Zaun reaches boiling point. Jinx\'s transformation into the chaotic symbol of the undercity sets up an irreversible collision course with Vi and Enforcer Caitlyn. We break down teaser clues, hextech evolution, and new champion cameos.',
                cover_image='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
                category_id=1,
                character_id=3,
                author_id=2,
                view_count=980,
                featured=True,
                tags='Arcane,Jinx,Gaming,LoL'
            ),
            Content(
                id=3,
                title='Mastering Cosplay Armor Crafting with EVA Foam: Beginner to Pro Guide',
                slug='cosplay-armor-crafting-eva-foam-guide',
                summary='Step-by-step tutorial on drafting patterns, heat shaping foam, and painting realistic metallic weathering.',
                content='Crafting lightweight yet durable armor is the Holy Grail of cosplay. In this step-by-step masterclass, we cover essential tools: high-density EVA foam, contact cement, heat gun technique, and acrylic weathering techniques. Learn how to achieve polished chrome or battle-worn steel textures effortlessly.',
                cover_image='https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
                category_id=3,
                character_id=None,
                author_id=3,
                view_count=650,
                featured=False,
                tags='Cosplay,Tutorial,Crafting,DIY'
            ),
            Content(
                id=4,
                title='The Evolution of Fighting Games: From Street Fighter II to Tekken 8',
                slug='evolution-of-fighting-games-sf-tekken',
                summary='How mechanical innovations, rollback netcode, and competitive esports reshaped fighting game history.',
                content='Fighting games have evolved from arcade coin-op cabinets into global esports phenomena. With Tekken 8 and Street Fighter 6 setting historic player records, we trace 30 years of frame data, motion inputs, and netcode technology that built modern competitive communities.',
                cover_image='https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
                category_id=2,
                character_id=None,
                author_id=1,
                view_count=430,
                featured=False,
                tags='Gaming,Esports,FightingGames'
            )
        ]
        db.session.add_all(contents)
        db.session.commit()

    # 6. Bookmarks
    if Bookmark.query.count() == 0:
        bm1 = Bookmark(id=1, user_id=2, content_id=1)
        bm2 = Bookmark(id=2, user_id=2, content_id=2)
        db.session.add_all([bm1, bm2])
        db.session.commit()

    # 7. Feedback
    if Feedback.query.count() == 0:
        fb1 = Feedback(id=1, user_id=2, name='Tuấn Phạm', email='user@fanhub.com', subject='Feature Request: Dark mode enhancements', message='Loving the new Fandom universe layout! Could we get customized character badges for top commenters?', status='pending')
        fb2 = Feedback(id=2, user_id=None, name='Mai Anh', email='maianh@gmail.com', subject='Cosplay Event Partnership', message='We would love to sponsor the upcoming Fan Hub Plus Anime Expo 2026. Please contact us!', status='resolved')
        db.session.add_all([fb1, fb2])
        db.session.commit()

    # 8. Merchandise
    if Merchandise.query.count() == 0:
        m1 = Merchandise(id=1, name='Levi Ackerman 1/7 Scale PVC Figure (Final Season Ver.)', description='Ultra detailed scale figure featuring Captain Levi in full ODM gear.', price=189.99, image='https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600', category='Figures', stock=25, rating=4.9)
        m2 = Merchandise(id=2, name='Arcane Jinx Fishbones LED Replica Launcher', description='Full-scale light-up prop with sound effects and custom display stand.', price=249.00, image='https://images.unsplash.com/photo-1563089145-599997674d42?w=600', category='Props & Replicas', stock=10, rating=5.0)
        m3 = Merchandise(id=3, name='Dragon Ball Z Super Saiyan Goku Vintage Hoodie', description='Premium heavy cotton embroidered hoodie with iconic Kanji symbol.', price=65.50, image='https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600', category='Apparel', stock=100, rating=4.7)
        db.session.add_all([m1, m2, m3])
        db.session.commit()

    # 9. Events
    if Event.query.count() == 0:
        e1 = Event(id=1, title='Fan Hub Expo 2026: Fandom Universe Summit', description='The largest gathering of anime fans, cosplayers, gamers, and digital creators in Southeast Asia.', location='National Convention Center, Hanoi', event_date='15-17 October 2026', banner='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200', organizer='Fan Hub Plus Team')
        e2 = Event(id=2, title='League of Legends Arcane Watch Party & Cosplay Championship', description='Exclusive screening, live orchestra performance, and 10,000 USD cosplay tournament.', location='GEM Center, Ho Chi Minh City', event_date='05 November 2026', banner='https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200', organizer='Riot Games & Fan Hub')
        db.session.add_all([e1, e2])
        db.session.commit()
