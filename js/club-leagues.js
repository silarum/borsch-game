// ================== СЕТЬ КЛУБОВ, ЛИГИ И ТУРНИРЫ ЗАВЕДЕНИЙ ==================
(function () {
    'use strict';

    const esc = window.escapeHtml;
    const now = Date.now();
    const DAY = 86400000;
    const tierNames = { district: 'Районная лига', city: 'Городская лига', world: 'Мировая лига' };
    const statusNames = {
        pending: 'На проверке', verified: 'Проверен', registration: 'Регистрация',
        live: 'Идёт турнир', finished: 'Завершён', draft: 'Черновик',
        pending_review: 'Ждёт главного администратора', rejected: 'Отклонён'
    };
    const venueNames = {
        fast_food: 'Фаст‑фуд', cafe: 'Кафе', restaurant: 'Ресторан',
        food_court: 'Фуд‑корт', other: 'Другое заведение'
    };

    const defaultClubs = [
        {
            id: 'hw01', name: 'Голодные волки', venueName: 'Hungry Wolves Arena', venueType: 'fast_food',
            ownerTelegramId: 0, ownerName: 'silarum', countryCode: 'SE', region: 'Stockholm', city: 'Стокгольм',
            district: 'Södermalm', address: 'Центральная арена', description: 'Фаундер‑клуб сети: еда, бойцы и турниры.',
            status: 'verified', rating: 1680, members: 24, memberIds: [], emoji: '🐺', isFounder: true
        },
        {
            id: 'club-ton-burger', name: 'TON Burger Fighters', venueName: 'TON Burger', venueType: 'fast_food',
            ownerTelegramId: -1, ownerName: 'TonChef', countryCode: 'SE', region: 'Stockholm', city: 'Стокгольм',
            district: 'Norrmalm', address: 'Drottninggatan', description: 'Быстрая еда и быстрые бойцы.',
            status: 'verified', rating: 1548, members: 18, memberIds: [], emoji: '🍔'
        },
        {
            id: 'club-block-pizza', name: 'Block Pizza Crew', venueName: 'Block Pizza', venueType: 'restaurant',
            ownerTelegramId: -2, ownerName: 'PizzaNode', countryCode: 'DE', region: 'Berlin', city: 'Берлин',
            district: 'Mitte', address: 'Alexanderplatz', description: 'Городская команда пицца‑арены.',
            status: 'verified', rating: 1492, members: 16, memberIds: [], emoji: '🍕'
        },
        {
            id: 'club-rumir-coffee', name: 'RUMIR Coffee Guard', venueName: 'RUMIR Coffee', venueType: 'cafe',
            ownerTelegramId: -3, ownerName: 'CoffeeWolf', countryCode: 'FI', region: 'Uusimaa', city: 'Хельсинки',
            district: 'Kallio', address: 'Arena Point', description: 'Кофе, сообщество и вечерние отборы.',
            status: 'verified', rating: 1435, members: 12, memberIds: [], emoji: '☕'
        }
    ];

    const defaultTournaments = [
        {
            id: 'tour-district-burger', organizerClubId: 'hw01', title: 'Битва за район: Hungry Wolves',
            description: 'Локальный вечерний турнир для бойцов ближайших заведений.', leagueTier: 'district',
            countryCode: 'SE', city: 'Стокгольм', district: 'Södermalm', discipline: 'fight', format: 'knockout',
            status: 'registration', approvalStatus: 'approved', maxParticipants: 16, minRating: 0, entrySilarum: 0,
            prizeType: 'food', prizeTitle: 'Бесплатный комбо‑ужин на двоих', prizeAmount: 25, prizeCurrency: 'SILARUM',
            startsAt: now + 3 * DAY, registrationEndsAt: now + 2 * DAY, minAge: 13,
            rules: 'Один бой — 45 секунд. Побеждает участник, выигравший два раунда.', registrations: [], matches: []
        },
        {
            id: 'tour-city-stockholm', organizerClubId: 'club-ton-burger', title: 'Кубок города: Crypto Fast Food',
            description: 'Городской кубок среди команд заведений.', leagueTier: 'city', countryCode: 'SE',
            city: 'Стокгольм', district: '', discipline: 'mixed', format: 'groups_knockout', status: 'registration',
            approvalStatus: 'approved', maxParticipants: 32, minRating: 1250, entrySilarum: 0,
            prizeType: 'physical', prizeTitle: 'Игровой смартфон и год бесплатных обедов', prizeAmount: 2500,
            prizeCurrency: 'SILARUM', startsAt: now + 10 * DAY, registrationEndsAt: now + 8 * DAY, minAge: 16,
            requiresQualification: true, qualifyingTier: 'district',
            rules: 'Групповой этап: Крипто Борщ. Плей‑офф: бои Волчьей сотни.', registrations: [], matches: []
        },
        {
            id: 'tour-world-wolves', organizerClubId: null, title: 'World Wolf League · Season Zero',
            description: 'Мировой турнир лучших городских клубов.', leagueTier: 'world', countryCode: '',
            city: '', district: '', discipline: 'mixed', format: 'groups_knockout', status: 'pending_review',
            approvalStatus: 'pending', maxParticipants: 128, minRating: 1500, entrySilarum: 0,
            prizeType: 'silarum', prizeTitle: 'Глобальный призовой фонд', prizeAmount: 25000, prizeCurrency: 'SILARUM',
            startsAt: now + 40 * DAY, registrationEndsAt: now + 30 * DAY, minAge: 18,
            requiresQualification: true, qualifyingTier: 'city',
            rules: 'Участие после квалификации в городской лиге. Выплата только после проверки документов.',
            registrations: [], matches: []
        }
    ];

    let networkClubs = window.readLocalArray('fightNetworkClubs', null) || defaultClubs;
    let tournaments = window.readLocalArray('fightNetworkTournaments', null) || defaultTournaments;
    let vouchers = window.readLocalArray('fightRewardVouchers');
    let activeHubTab = 'leagues';
    let activeOwnerTab = 'overview';
    let activeTournamentId = null;
    let serverSyncStarted = false;
    let managedClubId = null;
    let clubRoster = [];
    let publicNews = window.readLocalArray('fightClubNews', null) || [{
        id: 'news-season-zero', clubId: 'hw01', postType: 'news', title: 'Открытие World Wolf League',
        body: 'Голодные волки собирают первые районные команды. Следи за отборами и афишами заведений.',
        posterUrl: 'assets/fight/wolf-arena.webp', publishedAt: Date.now()
    }];
    let clubChallenges = window.readLocalArray('fightClubChallenges');
    let clubMiningOrders = window.readLocalArray('fightClubMiningOrders');
    let clubPrizeCatalog = window.readLocalArray('fightClubPrizeCatalog');
    let clubExchangeRequests = [];
    let clubContributionCampaign = window.readLocalJson('fightClubContributionCampaign', null);
    let clubContributions = window.readLocalArray('fightClubContributions');
    let currentClubPermissions = {};
    let clubTreasury = window.readLocalJson('fightClubTreasury', { silarumAvailable: 5000, silarumLocked: 0 });
    let poolOptions = [{ id: 'demo-pool', name: 'Крипто Беспредел', entry_srum_min: 0.01, entry_srum_max: 300, entry_srum_default: 1 }];

    tournaments.forEach(function (tournament) {
        if (tournament.requiresQualification === undefined && ['city', 'world'].includes(tournament.leagueTier)) {
            tournament.requiresQualification = true;
            tournament.qualifyingTier = tournament.leagueTier === 'world' ? 'city' : 'district';
        }
    });

    function uid(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function requestUuid() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
            const value = Math.floor(Math.random() * 16);
            return (char === 'x' ? value : (value & 3) | 8).toString(16);
        });
    }

    function currentUserId() {
        return Number(window.userId || localStorage.getItem('userId') || 0);
    }

    function currentNickname() {
        return String(window.userNickname || 'Майнер').slice(0, 64);
    }

    function saveNetwork() {
        localStorage.setItem('fightNetworkClubs', JSON.stringify(networkClubs));
        localStorage.setItem('fightNetworkTournaments', JSON.stringify(tournaments));
        localStorage.setItem('fightRewardVouchers', JSON.stringify(vouchers));
        localStorage.setItem('fightClubNews', JSON.stringify(publicNews));
        localStorage.setItem('fightClubChallenges', JSON.stringify(clubChallenges));
        localStorage.setItem('fightClubMiningOrders', JSON.stringify(clubMiningOrders));
        localStorage.setItem('fightClubPrizeCatalog', JSON.stringify(clubPrizeCatalog));
        localStorage.setItem('fightClubTreasury', JSON.stringify(clubTreasury));
        localStorage.setItem('fightClubContributionCampaign', JSON.stringify(clubContributionCampaign));
        localStorage.setItem('fightClubContributions', JSON.stringify(clubContributions));
    }

    function cloudMutation(action, payload) {
        if (!window.APP_CONFIG.cloudSyncEnabled) return;
        gameApi(action, payload).then(function () {
            syncFightHub(true);
        }).catch(function () {
            alert('Изменение сохранено в тестовом режиме, но сервер пока недоступен. Повторите после восстановления связи.');
        });
    }

    async function serverMutation(action, payload, failureLabel) {
        try {
            const result = await gameApi(action, payload);
            syncFightHub(true);
            return result;
        } catch (error) {
            alert(`${failureLabel}: ${error.message}`);
            return null;
        }
    }

    function getClub(id) {
        return networkClubs.find(function (club) { return club.id === id; });
    }

    function getOwnedClub() {
        const id = currentUserId();
        const nickname = currentNickname();
        return networkClubs.find(function (club) {
            return club.ownerTelegramId === id || (id === 0 && club.ownerName === nickname);
        });
    }

    function getMemberClub() {
        const id = currentUserId();
        return getOwnedClub() || networkClubs.find(function (club) {
            return Array.isArray(club.memberIds) && club.memberIds.includes(id);
        });
    }

    function getManagedClub() {
        return getClub(managedClubId) || getOwnedClub();
    }

    function canClub(permission) {
        const club = getManagedClub();
        if (!club) return false;
        const isOwner = club.ownerTelegramId === currentUserId() || (currentUserId() === 0 && club.ownerName === currentNickname());
        return isOwner || currentClubPermissions[permission] === true;
    }

    function setActiveTab(tab) {
        document.querySelectorAll('.club-hub-tab').forEach(function (button) {
            const map = { 'club-all-btn': 'leagues', 'club-news-btn': 'news', 'club-tournaments-btn': 'tournaments', 'club-my-btn': 'my', 'club-create-btn': 'create' };
            button.classList.toggle('active', map[button.id] === tab);
        });
    }

    function renderHub(tab) {
        activeHubTab = tab || activeHubTab;
        setActiveTab(activeHubTab);
        const container = document.getElementById('club-content');
        if (!container) return;
        if (activeHubTab === 'leagues') renderLeagues(container);
        if (activeHubTab === 'news') renderNewsWall(container);
        if (activeHubTab === 'tournaments') renderTournaments(container);
        if (activeHubTab === 'my') renderMyNetworkClub(container);
        if (activeHubTab === 'create') renderClubCreation(container);
        bindHub(container);
        syncFightHub();
    }

    function syncFightHub(force) {
        if (!window.APP_CONFIG.cloudSyncEnabled || (serverSyncStarted && !force)) return;
        serverSyncStarted = true;
        gameApi('fight_hub').then(function (data) {
            if (!data) return;
            const ownMembership = data.membership;
            const serverClubs = Array.isArray(data.clubs) ? data.clubs.slice() : [];
            if (data.ownedClub && !serverClubs.some(function (item) { return item.id === data.ownedClub.id; })) serverClubs.push(data.ownedClub);
            if (data.managedClub && !serverClubs.some(function (item) { return item.id === data.managedClub.id; })) serverClubs.push(data.managedClub);
            managedClubId = data.managedClub?.id || data.ownedClub?.id || null;
            currentClubPermissions = data.memberPermissions && typeof data.memberPermissions === 'object' ? data.memberPermissions : {};
            networkClubs = serverClubs.map(function (club) {
                return {
                    id: club.id, name: club.name, venueName: club.venue_name, venueType: club.venue_type,
                    ownerTelegramId: Number(club.owner_telegram_user_id || (data.ownedClub?.id === club.id ? currentUserId() : 0)),
                    ownerName: club.owner_nickname || '', countryCode: club.country_code, region: club.region || '',
                    city: club.city, district: club.district || '', address: club.address || '', description: club.description || '',
                    status: club.status, rating: Number(club.rating || 1200), members: Number(club.member_count || 0),
                    memberIds: ownMembership?.club_id === club.id ? [currentUserId()] : [], emoji: '🐺'
                };
            });
            const ownRegistrations = new Map((data.registrations || []).map(function (entry) { return [entry.tournament_id, entry]; }));
            const managedNames = new Map((data.managedRegistrations || []).map(function (entry) { return [Number(entry.telegram_user_id), entry.nickname]; }));
            tournaments = (data.tournaments || []).map(function (item) {
                const registration = ownRegistrations.get(item.id);
                const eligibility = item.eligibility || {};
                const playerMatches = (data.playerMatches || []).filter(function (match) { return match.tournament_id === item.id; });
                const playerMatch = playerMatches.slice().sort(function (a, b) { return Number(b.round_number) - Number(a.round_number); })[0] || null;
                const managedMatches = (data.managedMatches || []).filter(function (match) { return match.tournament_id === item.id; }).map(function (match) {
                    return {
                        id: match.id, round: Number(match.round_number), matchNumber: Number(match.match_number),
                        oneId: Number(match.player_one_telegram_id), twoId: match.player_two_telegram_id ? Number(match.player_two_telegram_id) : null,
                        one: managedNames.get(Number(match.player_one_telegram_id)) || `Игрок #${Number(match.player_one_telegram_id)}`,
                        two: match.player_two_telegram_id ? (managedNames.get(Number(match.player_two_telegram_id)) || `Игрок #${Number(match.player_two_telegram_id)}`) : 'BYE',
                        winnerId: match.winner_telegram_id ? Number(match.winner_telegram_id) : null, status: match.status, score: match.score || {}
                    };
                });
                return {
                    id: item.id, organizerClubId: item.organizer_club_id, title: item.title, description: item.description,
                    leagueTier: item.league_tier, countryCode: item.country_code || '', city: item.city || '', district: item.district || '',
                    discipline: item.discipline, format: item.format, status: item.status, approvalStatus: item.approval_status,
                    maxParticipants: Number(item.max_participants), minRating: Number(item.min_rating), entrySilarum: Number(item.entry_silarum),
                    prizeType: item.prize_type, prizeTitle: item.prize_title, prizeAmount: Number(item.prize_fund_amount),
                    prizeCurrency: item.prize_currency, startsAt: new Date(item.starts_at).getTime(), registrationEndsAt: new Date(item.registration_ends_at).getTime(),
                    posterUrl: item.poster_url || '',
                    minAge: Number(item.min_age), rules: item.rules_text, requiresQualification: eligibility.requires_qualification === true,
                    qualifyingTier: eligibility.qualifying_tier || null, registrationCount: Number(data.registrationCounts?.[item.id] || 0),
                    registrations: registration ? [{
                        telegramUserId: currentUserId(), nickname: registration.nickname, clubId: registration.club_id,
                        fighterKey: registration.fighter_key, ratingAtEntry: Number(registration.rating_at_entry),
                        status: registration.status, roundWins: 0, registeredAt: new Date(registration.registered_at).getTime()
                    }] : [], matches: managedMatches, playerMatch
                };
            });
            if (Array.isArray(data.managedVouchers)) {
                vouchers = data.managedVouchers.map(function (voucher) {
                    return {
                        id: voucher.id, tournamentId: voucher.tournament_id, clubId: voucher.club_id,
                        winnerTelegramId: Number(voucher.winner_telegram_user_id),
                        winnerNickname: managedNames.get(Number(voucher.winner_telegram_user_id)) || `Игрок #${Number(voucher.winner_telegram_user_id)}`,
                        prizeType: 'mixed', title: voucher.title, code: voucher.public_code,
                        status: voucher.status, createdAt: new Date(voucher.created_at).getTime()
                    };
                });
            }
            clubRoster = Array.isArray(data.clubRoster) ? data.clubRoster : [];
            publicNews = (data.publicNews || []).map(function (post) {
                return {
                    id: post.id, clubId: post.club_id, postType: post.post_type, title: post.title,
                    body: post.body, posterUrl: post.poster_url || '', publishedAt: new Date(post.published_at || post.created_at).getTime()
                };
            });
            clubChallenges = (data.publicChallenges || data.clubChallenges || []).map(function (item) {
                return {
                    id: item.id, challengerClubId: item.challenger_club_id, defenderClubId: item.defender_club_id,
                    title: item.title, message: item.message, proposedStartsAt: new Date(item.proposed_starts_at).getTime(),
                    format: item.format, ratingPoints: Number(item.rating_points), status: item.status, winnerClubId: item.winner_club_id
                };
            });
            clubMiningOrders = [...(data.clubMiningOrders || []), ...(data.fighterMiningOrders || [])].filter(function (item, index, list) {
                return list.findIndex(function (candidate) { return candidate.id === item.id; }) === index;
            }).map(function (item) {
                return {
                    id: item.id, clubId: item.club_id, fighterTelegramUserId: Number(item.fighter_telegram_user_id),
                    poolId: item.pool_id, entrySilarum: Number(item.entry_silarum), rewardToClubPercent: Number(item.reward_to_club_percent),
                    fighterConsentStatus: item.fighter_consent_status, status: item.status, serverSessionId: item.server_session_id,
                    createdAt: new Date(item.created_at).getTime()
                };
            });
            clubPrizeCatalog = data.clubPrizeCatalog || [];
            clubExchangeRequests = data.clubExchangeRequests || [];
            clubContributionCampaign = data.contributionCampaign ? {
                id: data.contributionCampaign.id, clubId: data.contributionCampaign.club_id,
                monthStart: data.contributionCampaign.month_start,
                suggestedSilarum: Number(data.contributionCampaign.suggested_silarum),
                message: data.contributionCampaign.message || '', enabled: Boolean(data.contributionCampaign.enabled),
                totalSilarum: Number(data.contributionCampaign.total_silarum || 0),
                contributorCount: Number(data.contributionCampaign.contributor_count || 0)
            } : null;
            clubContributions = data.clubContributions || [];
            clubTreasury = data.clubTreasury ? {
                silarumAvailable: Number(data.clubTreasury.silarum_available || 0),
                silarumLocked: Number(data.clubTreasury.silarum_locked || 0)
            } : clubTreasury;
            poolOptions = Array.isArray(data.pools) && data.pools.length ? data.pools : poolOptions;
            saveNetwork();
            renderHub(activeHubTab);
        }).catch(function () {
            serverSyncStarted = false;
        });
    }

    function renderLeagues(container) {
        const verified = networkClubs.filter(function (club) { return club.status === 'verified'; });
        const top = verified.slice().sort(function (a, b) { return b.rating - a.rating; });
        container.innerHTML = `<section class="league-story">
            <small>ПУТЬ К МИРОВОЙ АРЕНЕ</small><h3>Заведение → клуб → лига</h3>
            <p>Каждый фаст‑фуд, кафе или ресторан может открыть свою команду. Победы поднимают клуб от района к городу и затем в World Wolf League.</p>
            <div class="league-path"><span><b>1</b>Район</span><i>→</i><span><b>2</b>Город</span><i>→</i><span><b>3</b>Мир</span></div>
        </section>
        <div class="league-tier-grid">
            ${leagueTierCard('district', '🏘', 'Соседние заведения', 'Локальные бои и призы едой', verified.filter(function (c) { return c.city === 'Стокгольм'; }).length)}
            ${leagueTierCard('city', '🏙', 'Лучшие района', 'Кубки города и подарки спонсоров', verified.length)}
            ${leagueTierCard('world', '🌍', 'Чемпионы городов', 'Международный сезон и глобальные призы', top.length)}
        </div>
        <section class="network-ranking"><div class="club-section-head"><div><small>CLUB POWER</small><h3>Рейтинг заведений</h3></div><button data-hub-action="open-create">+ Открыть клуб</button></div>
            ${top.map(function (club, index) { return clubRankRow(club, index); }).join('')}
        </section>`;
    }

    function renderNewsWall(container) {
        const posts = publicNews.slice().sort(function (a, b) { return Number(b.publishedAt || 0) - Number(a.publishedAt || 0); });
        const visibleChallenges = clubChallenges.filter(function (item) { return ['accepted', 'live', 'finished'].includes(item.status); });
        container.innerHTML = `<section class="news-wall-head"><div><small>COMMUNITY FEED</small><h3>Афиши и новости клубов</h3><p>Турниры, вызовы заведений и результаты бойцов.</p></div><span>📣</span></section>
        <div class="club-news-wall">${posts.map(function (post) {
            const club = getClub(post.clubId);
            const poster = post.posterUrl ? `<img src="${esc(post.posterUrl)}" alt="Афиша ${esc(post.title)}">` : '';
            return `<article class="club-news-card">${poster}<div><small>${esc(club?.venueName || 'Crypto Borsch')} · ${formatDate(post.publishedAt || Date.now())}</small><h3>${esc(post.title)}</h3><p>${esc(post.body || '')}</p><span>${esc(({ news: 'НОВОСТЬ', tournament: 'ТУРНИР', challenge: 'ВЫЗОВ', result: 'РЕЗУЛЬТАТ', contribution: 'ПОДДЕРЖКА КЛУБА' })[post.postType] || 'НОВОСТЬ')}</span></div></article>`;
        }).join('') || '<div class="empty">Новостей пока нет</div>'}</div>
        <section class="challenge-wall"><div class="club-section-head"><div><small>CLUB VS CLUB</small><h3>Поединки за рейтинг</h3></div></div>${visibleChallenges.map(challengeCard).join('') || '<div class="empty">Принятых вызовов пока нет</div>'}</section>`;
    }

    function challengeCard(challenge) {
        const challenger = getClub(challenge.challengerClubId);
        const defender = getClub(challenge.defenderClubId);
        return `<article class="challenge-card"><div><span>${esc(challenger?.emoji || '🐺')}</span><b>${esc(challenger?.name || 'Клуб')}</b></div><i>VS<br><small>+${Number(challenge.ratingPoints || 0)}</small></i><div><span>${esc(defender?.emoji || '🐺')}</span><b>${esc(defender?.name || 'Клуб')}</b></div><p>${esc(challenge.title)}</p><time>${formatDate(challenge.proposedStartsAt || Date.now())}</time></article>`;
    }

    function leagueTierCard(tier, icon, subtitle, description, count) {
        return `<button class="league-tier-card ${tier}" data-league-tier="${tier}"><span>${icon}</span><small>${tierNames[tier]}</small><h3>${subtitle}</h3><p>${description}</p><b>${count} клубов</b></button>`;
    }

    function clubRankRow(club, index) {
        return `<button class="network-club-row" data-club-id="${club.id}"><span class="network-place">${index + 1}</span><span class="network-badge">${esc(club.emoji || '🐺')}</span><span><b>${esc(club.name)}</b><small>${esc(club.venueName)} · ${esc(club.city)}</small></span><strong>${Number(club.rating || 0)}</strong></button>`;
    }

    function renderClubDetail(container, clubId) {
        const club = getClub(clubId);
        if (!club) return renderLeagues(container);
        const memberClub = getMemberClub();
        const isMember = memberClub?.id === club.id;
        const isOwner = getOwnedClub()?.id === club.id;
        const clubTournaments = tournaments.filter(function (item) { return item.organizerClubId === club.id && item.status !== 'draft'; });
        container.innerHTML = `<button class="club-detail-back" data-hub-action="back-leagues">← К рейтингу</button>
        <section class="club-detail-hero"><span>${esc(club.emoji || '🐺')}</span><small>${esc(venueNames[club.venueType] || 'Заведение')} · ${esc(club.city)} · ${esc(club.district)}</small><h3>${esc(club.name)}</h3><b>${esc(club.venueName)}</b><p>${esc(club.description || '')}</p>
            <div class="club-kpis"><span><b>${Number(club.rating)}</b>рейтинг</span><span><b>${Number(club.members || 0)}</b>бойцов</span><span><b>${clubTournaments.length}</b>турниров</span></div>
            ${isOwner ? `<button data-owner-dashboard="${club.id}">Открыть кабинет владельца</button>` : isMember ? '<button disabled>Ты в этом клубе</button>' : memberClub ? '<button disabled>Сначала покинь текущий клуб</button>' : `<button data-join-network-club="${club.id}">Вступить в команду</button>`}
        </section><section class="club-detail-events"><h3>События заведения</h3>${clubTournaments.map(tournamentCard).join('') || '<div class="empty">Событий пока нет</div>'}</section>`;
    }

    function renderTournaments(container, tierFilter) {
        const visible = tournaments.filter(function (tournament) {
            return (!tierFilter || tournament.leagueTier === tierFilter) && tournament.status !== 'draft';
        }).sort(function (a, b) { return Number(a.startsAt) - Number(b.startsAt); });
        container.innerHTML = `<section class="tournament-discovery-head"><div><small>LIVE COMMUNITY</small><h3>Турниры клубов</h3><p>Выбери уровень и зарегистрируй бойца.</p></div><span>${visible.length}</span></section>
            <div class="league-filter"><button data-tier-filter="" class="${!tierFilter ? 'active' : ''}">Все</button><button data-tier-filter="district" class="${tierFilter === 'district' ? 'active' : ''}">Район</button><button data-tier-filter="city" class="${tierFilter === 'city' ? 'active' : ''}">Город</button><button data-tier-filter="world" class="${tierFilter === 'world' ? 'active' : ''}">Мир</button></div>
            <div class="community-tournament-list">${visible.map(tournamentCard).join('') || '<div class="empty">Турниров этого уровня пока нет</div>'}</div>`;
    }

    function tournamentCard(tournament) {
        const club = getClub(tournament.organizerClubId);
        const isRegistered = tournament.registrations.some(function (entry) { return entry.telegramUserId === currentUserId(); });
        const canEnter = ['registration', 'live'].includes(tournament.status) && tournament.approvalStatus !== 'pending';
        const location = tournament.leagueTier === 'world' ? 'Все страны' : [tournament.district, tournament.city].filter(Boolean).join(' · ');
        return `<article class="community-tournament ${tournament.leagueTier}">
            ${tournament.posterUrl ? `<img class="community-tournament-poster" src="${esc(tournament.posterUrl)}" alt="Афиша ${esc(tournament.title)}">` : ''}
            <div class="tournament-topline"><span>${tierNames[tournament.leagueTier]}</span><i class="status-${tournament.status}">${statusNames[tournament.status] || tournament.status}</i></div>
            <h3>${esc(tournament.title)}</h3><p>${esc(tournament.description)}</p>
            <div class="tournament-facts"><span>📍 ${esc(location || 'Онлайн')}</span><span>👥 ${Number(tournament.registrationCount ?? tournament.registrations.length)}/${Number(tournament.maxParticipants)}</span><span>🎮 ${disciplineName(tournament.discipline)}</span></div>
            <div class="tournament-prize"><span>${prizeIcon(tournament.prizeType)}</span><div><small>ГЛАВНЫЙ ПРИЗ</small><b>${esc(tournament.prizeTitle)}</b><em>${formatPrize(tournament)}</em></div></div>
            <div class="tournament-owner"><span>${club ? esc(club.emoji || '🐺') : '🌍'}</span><div><small>Организатор</small><b>${esc(club ? club.venueName : 'Crypto Borsch')}</b></div><time>${formatDate(tournament.startsAt)}</time></div>
            ${canEnter ? `<button class="tournament-enter ${isRegistered ? 'ready' : ''}" data-tournament-enter="${tournament.id}">${isRegistered ? '⚔ В бой / квалификация' : 'Зарегистрироваться'}</button>` : '<button class="tournament-enter" disabled>Ожидает проверки</button>'}
            <button class="tournament-rules-link" data-tournament-rules="${tournament.id}">Условия участия и призы</button>
        </article>`;
    }

    function disciplineName(value) {
        return ({ fight: 'Бойцы', borsch: 'Крипто Борщ', mixed: 'Две дисциплины' })[value] || value;
    }

    function prizeIcon(type) {
        return ({ food: '🍔', rumir: '🪙', silarum: '◈', physical: '🎁', cash: '🏆', mixed: '💎' })[type] || '🏆';
    }

    function formatPrize(tournament) {
        if (!Number(tournament.prizeAmount)) return 'Приз от заведения';
        return `${Number(tournament.prizeAmount).toLocaleString('ru-RU')} ${esc(tournament.prizeCurrency)}`;
    }

    function formatDate(value) {
        return new Date(Number(value)).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }

    function renderMyNetworkClub(container) {
        const club = getMemberClub();
        if (!club) {
            container.innerHTML = `<section class="no-club-card"><span>🐺</span><small>ТВОЯ КОМАНДА</small><h3>Ты ещё не в клубе</h3><p>Вступи в команду любимого заведения или предложи владельцу открыть собственную арену.</p><button data-hub-action="open-create">Открыть клуб заведения</button></section>`;
            return;
        }
        const isOwner = club.ownerTelegramId === currentUserId() || (currentUserId() === 0 && club.ownerName === currentNickname());
        const canManage = getManagedClub()?.id === club.id;
        const clubTournaments = tournaments.filter(function (item) { return item.organizerClubId === club.id; });
        const pendingMining = clubMiningOrders.filter(function (item) {
            return item.fighterTelegramUserId === currentUserId() && item.status === 'pending_consent';
        });
        const campaign = clubContributionCampaign?.clubId === club.id && clubContributionCampaign.enabled ? clubContributionCampaign : null;
        container.innerHTML = `<section class="my-network-club">
            <div class="my-club-cover"><span>${esc(club.emoji || '🐺')}</span><i class="club-status ${club.status}">${statusNames[club.status] || club.status}</i></div>
            <small>${esc(venueNames[club.venueType] || 'Заведение')} · ${esc(club.city)} · ${esc(club.district)}</small>
            <h3>${esc(club.name)}</h3><p>${esc(club.description || '')}</p>
            <div class="club-kpis"><span><b>${Number(club.rating)}</b>рейтинг</span><span><b>${Number(club.members || 1)}</b>бойцов</span><span><b>${clubTournaments.length}</b>турниров</span></div>
            <div class="club-actions"><button data-club-fight="${club.id}">⚔ Тренировка</button>${canManage ? '<button data-owner-dashboard="' + club.id + '">⚙ Управление клубом</button>' : '<button data-leave-network-club="' + club.id + '">Покинуть</button>'}</div>
        </section>
        ${campaign ? `<form id="club-monthly-contribution-form" class="monthly-contribution-card"><small>ДОБРОВОЛЬНАЯ ПОДДЕРЖКА · ${esc(String(campaign.monthStart).slice(0, 7))}</small><h3>Помочь клубу в этом месяце</h3><p>${esc(campaign.message || 'Поддержи турниры, афиши и развитие команды любой удобной суммой.')}</p><div><input required type="number" min="0.01" step="0.01" name="amountSilarum" value="${Number(campaign.suggestedSilarum)}"><button type="submit">Поддержать SILARUM</button></div><label><input type="checkbox" name="publishOnWall" checked><span>Разрешаю опубликовать благодарность на стене клуба</span></label><em>Уже собрано ${Number(campaign.totalSilarum).toFixed(2)} SILARUM · ${Number(campaign.contributorCount)} участников. Взнос не обязателен.</em></form>` : ''}
        ${pendingMining.length ? `<section class="fighter-consent-card"><small>ЗАПРОС КЛУБА</small><h3>Выход в «Крипто Беспредел»</h3>${pendingMining.map(function (order) {
            const pool = poolOptions.find(function (item) { return item.id === order.poolId; });
            return `<div><p><b>${esc(pool?.name || 'Игровой пул')}</b>Вход оплачивает клуб: ${Number(order.entrySilarum)} SILARUM. В клубную казну вернётся ${Number(order.rewardToClubPercent)}% награды.</p><span><button data-mining-consent="${order.id}" data-accepted="true">Согласен</button><button data-mining-consent="${order.id}" data-accepted="false">Отказаться</button></span></div>`;
        }).join('')}</section>` : ''}
        <section class="club-benefits"><h3>Что получает клуб</h3><div><span>🍟</span><p><b>Живой трафик</b>Турниры приводят гостей в заведение.</p></div><div><span>🏆</span><p><b>Собственная команда</b>Рейтинг и узнаваемость бренда.</p></div><div><span>🎁</span><p><b>Призы за SILARUM</b>Еда, купоны и подарки имеют прозрачную стоимость.</p></div></section>`;
    }

    function renderClubCreation(container) {
        const owned = getOwnedClub();
        if (owned) {
            container.innerHTML = `<section class="no-club-card"><span>${esc(owned.emoji || '🐺')}</span><h3>Клуб уже открыт</h3><p>${esc(owned.name)} связан с заведением ${esc(owned.venueName)}.</p><button data-owner-dashboard="${owned.id}">Открыть кабинет владельца</button></section>`;
            return;
        }
        container.innerHTML = `<form id="network-club-form" class="network-form">
            <div class="form-intro"><small>ДЛЯ ВЛАДЕЛЬЦА ЗАВЕДЕНИЯ</small><h3>Открыть бойцовский клуб</h3><p>Создайте арену бренда и отправьте заявку на проверку.</p></div>
            <label>Название заведения<input required maxlength="120" name="venueName" placeholder="Например, Hungry Wolves Burger"></label>
            <label>Название клуба<input required maxlength="80" name="name" placeholder="Например, Волчья сотня"></label>
            <div class="network-form-grid"><label>Тип<select name="venueType"><option value="fast_food">Фаст‑фуд</option><option value="cafe">Кафе</option><option value="restaurant">Ресторан</option><option value="food_court">Фуд‑корт</option><option value="other">Другое</option></select></label><label>Код страны<input required minlength="2" maxlength="2" name="countryCode" value="SE"></label></div>
            <div class="network-form-grid"><label>Город<input required maxlength="100" name="city" placeholder="Стокгольм"></label><label>Район<input maxlength="100" name="district" placeholder="Södermalm"></label></div>
            <label>Адрес<input maxlength="240" name="address" placeholder="Адрес проведения турниров"></label>
            <label>Описание<textarea maxlength="1000" name="description" placeholder="Расскажите о заведении и команде"></textarea></label>
            <label class="form-consent"><input required type="checkbox" name="authority"><span>Я владелец или уполномоченный представитель заведения и согласен пройти проверку.</span></label>
            <div class="verification-note"><b>Что проверяет администратор</b><span>Связь с заведением · адрес · право использовать бренд · ответственное лицо за призы</span></div>
            <button type="submit">Отправить заявку</button>
        </form>`;
    }

    function bindHub(container) {
        if (container.dataset.networkBound === 'true') return;
        container.dataset.networkBound = 'true';
        container.addEventListener('click', function (event) {
            const action = event.target.closest('[data-hub-action]');
            if (action?.dataset.hubAction === 'open-create') renderHub('create');
            if (action?.dataset.hubAction === 'back-leagues') renderHub('leagues');
            const clubRow = event.target.closest('[data-club-id]');
            if (clubRow) renderClubDetail(container, clubRow.dataset.clubId);
            const tier = event.target.closest('[data-league-tier]');
            if (tier) { activeHubTab = 'tournaments'; setActiveTab('tournaments'); renderTournaments(container, tier.dataset.leagueTier); }
            const filter = event.target.closest('[data-tier-filter]');
            if (filter) renderTournaments(container, filter.dataset.tierFilter || '');
            const enter = event.target.closest('[data-tournament-enter]');
            if (enter) enterTournament(enter.dataset.tournamentEnter);
            const rules = event.target.closest('[data-tournament-rules]');
            if (rules) showTournamentRules(rules.dataset.tournamentRules);
            const owner = event.target.closest('[data-owner-dashboard]');
            if (owner) openOwnerDashboard(owner.dataset.ownerDashboard);
            const fight = event.target.closest('[data-club-fight]');
            if (fight) window.openWolfFight('training', { clubId: fight.dataset.clubFight });
            const leave = event.target.closest('[data-leave-network-club]');
            if (leave) leaveClub(leave.dataset.leaveNetworkClub);
            const join = event.target.closest('[data-join-network-club]');
            if (join) joinClub(join.dataset.joinNetworkClub);
            const miningConsent = event.target.closest('[data-mining-consent]');
            if (miningConsent) {
                const accepted = miningConsent.dataset.accepted === 'true';
                const order = clubMiningOrders.find(function (item) { return item.id === miningConsent.dataset.miningConsent; });
                if (order) {
                    if (window.APP_CONFIG.cloudSyncEnabled) {
                        serverMutation('respond_club_mining_order', { orderId: order.id, accepted }, 'Ответ не сохранён').then(function (saved) {
                            if (saved) renderHub('my');
                        });
                    } else {
                        order.status = accepted ? 'queued' : 'cancelled';
                        order.fighterConsentStatus = accepted ? 'accepted' : 'declined';
                        saveNetwork();
                        renderHub('my');
                    }
                }
            }
        });
        container.addEventListener('submit', function (event) {
            if (event.target.id === 'club-monthly-contribution-form') {
                event.preventDefault();
                contributeMonthly(new FormData(event.target));
                return;
            }
            if (event.target.id !== 'network-club-form') return;
            event.preventDefault();
            createClub(new FormData(event.target));
        });
    }

    function createClub(formData) {
        const values = Object.fromEntries(formData.entries());
        const club = {
            id: uid('club'), ownerTelegramId: currentUserId(), ownerName: currentNickname(),
            name: String(values.name).trim().slice(0, 80), venueName: String(values.venueName).trim().slice(0, 120),
            venueType: String(values.venueType), countryCode: String(values.countryCode).trim().toUpperCase().slice(0, 2),
            region: '', city: String(values.city).trim().slice(0, 100), district: String(values.district || '').trim().slice(0, 100),
            address: String(values.address || '').trim().slice(0, 240), description: String(values.description || '').trim().slice(0, 1000),
            status: 'pending', rating: 1200, members: 1, memberIds: [currentUserId()], emoji: '🐺'
        };
        if (!club.name || !club.venueName || !club.city || club.countryCode.length !== 2) return alert('Заполните название, страну и город');
        networkClubs.push(club);
        managedClubId = club.id;
        clubRoster = [{ club_id: club.id, telegram_user_id: currentUserId(), nickname: currentNickname(), role: 'owner', permissions: {}, fighter_key: localStorage.getItem('wolfSelectedFighter') || 'alpha', rating: 1200, wins: 0, losses: 0, status: 'active' }];
        saveNetwork();
        cloudMutation('create_fight_club', { club });
        renderHub('my');
        alert('Заявка создана. Клуб появится в рейтинге после проверки администратором.');
    }

    function leaveClub(clubId) {
        const club = getClub(clubId);
        if (!club || !confirm('Покинуть клуб?')) return;
        club.memberIds = (club.memberIds || []).filter(function (id) { return id !== currentUserId(); });
        club.members = Math.max(0, Number(club.members || 1) - 1);
        saveNetwork();
        cloudMutation('leave_fight_club', { clubId });
        renderHub('my');
    }

    function joinClub(clubId) {
        const club = getClub(clubId);
        if (!club || club.status !== 'verified' || getMemberClub()) return;
        club.memberIds = Array.isArray(club.memberIds) ? club.memberIds : [];
        if (!club.memberIds.includes(currentUserId())) club.memberIds.push(currentUserId());
        club.members = Number(club.members || 0) + 1;
        saveNetwork();
        cloudMutation('join_fight_club', { clubId, fighterKey: localStorage.getItem('wolfSelectedFighter') || 'alpha' });
        renderHub('my');
    }

    function enterTournament(tournamentId) {
        const tournament = tournaments.find(function (item) { return item.id === tournamentId; });
        if (!tournament) return;
        let registration = tournament.registrations.find(function (entry) { return entry.telegramUserId === currentUserId(); });
        if (!registration) {
            if (tournament.registrations.length >= tournament.maxParticipants) return alert('Места закончились');
            const rating = Number(window.readLocalJson('wolfFightStats', { rating: 1200 }).rating || 1200);
            if (rating < tournament.minRating) return alert(`Нужен рейтинг не ниже ${tournament.minRating}`);
            if (tournament.requiresQualification && !hasQualification(tournament.qualifyingTier, tournament)) {
                return alert(`Сначала выиграй отбор в уровне «${tierNames[tournament.qualifyingTier]}».`);
            }
            registration = {
                telegramUserId: currentUserId(), nickname: currentNickname(), clubId: getMemberClub()?.id || null,
                fighterKey: localStorage.getItem('wolfSelectedFighter') || 'alpha', ratingAtEntry: rating,
                status: 'registered', roundWins: 0, registeredAt: Date.now()
            };
            tournament.registrations.push(registration);
            saveNetwork();
            cloudMutation('register_fight_tournament', { tournamentId, fighterKey: registration.fighterKey });
            renderHub('tournaments');
            alert('Регистрация подтверждена. Теперь можно пройти квалификационный бой.');
            return;
        }
        activeTournamentId = tournament.id;
        if (window.APP_CONFIG.cloudSyncEnabled) {
            if (tournament.status !== 'live') return alert('Регистрация принята. Дождитесь, когда владелец клуба сформирует сетку.');
            if (!tournament.playerMatch) return alert('Для бойца пока нет активной пары. Обновите экран после жеребьёвки.');
            if (tournament.playerMatch.status === 'verified') return alert('Этот матч уже подтверждён судьёй.');
        }
        window.openWolfFight('tournament', {
            tournamentId: tournament.id, title: tournament.title, prizeTitle: tournament.prizeTitle,
            leagueTier: tournament.leagueTier, clubId: registration.clubId, matchId: tournament.playerMatch?.id || null
        });
    }

    function hasQualification(tier, target) {
        return tournaments.some(function (item) {
            if (item.leagueTier !== tier) return false;
            if (target.leagueTier === 'city' && item.city !== target.city) return false;
            return item.registrations.some(function (entry) {
                return entry.telegramUserId === currentUserId() && entry.status === 'winner';
            });
        });
    }

    function showTournamentRules(tournamentId) {
        const tournament = tournaments.find(function (item) { return item.id === tournamentId; });
        if (!tournament) return;
        const approval = tournament.approvalStatus === 'pending' ? '\n\nПризовой фонд и публикация ожидают проверки главной админкой.' : '';
        alert(`${tournament.title}\n\n${tournament.rules}\n\nВозраст: ${tournament.minAge}+\nВход: ${Number(tournament.entrySilarum) ? tournament.entrySilarum + ' SILARUM' : 'бесплатно'}\nПриз: ${tournament.prizeTitle}${approval}`);
    }

    function openOwnerDashboard(clubId) {
        const club = getClub(clubId);
        if (!club || club !== getManagedClub()) return alert('Нет выданных прав на управление клубом');
        activeOwnerTab = 'overview';
        if (typeof window.switchScreen === 'function') window.switchScreen('club-owner');
        renderOwnerDashboard();
    }

    function renderOwnerDashboard() {
        const root = document.getElementById('club-owner-content');
        const club = getManagedClub();
        if (!root || !club) return;
        const tabs = [
            ['overview', 'Обзор', true],
            ['tournaments', 'Турниры', canClub('manage_tournaments')],
            ['wall', 'Стена', canClub('manage_news')],
            ['team', 'Команда', canClub('manage_roster') || canClub('manage_mining') || canClub('manage_challenges')],
            ['treasury', 'Казна', canClub('manage_treasury') || canClub('manage_tournaments') || canClub('redeem_rewards')],
            ['settings', 'Заведение', canClub('manage_profile')]
        ].filter(function (tab) { return tab[2]; });
        if (!tabs.some(function (tab) { return tab[0] === activeOwnerTab; })) activeOwnerTab = tabs[0][0];
        root.innerHTML = `<section class="owner-hero"><div><small>CLUB CONTROL CENTER</small><h2>${esc(club.emoji)} ${esc(club.name)}</h2><p>${esc(club.venueName)} · ${esc(club.city)}</p></div><span class="club-status ${club.status}">${statusNames[club.status]}</span></section>
        <div class="owner-tabs">${tabs.map(function (tab) { return `<button data-owner-tab="${tab[0]}" class="${activeOwnerTab === tab[0] ? 'active' : ''}">${tab[1]}</button>`; }).join('')}</div>
        <div id="owner-tab-content">${renderOwnerTab(club)}</div>`;
        bindOwner(root);
    }

    function renderOwnerTab(club) {
        if (activeOwnerTab === 'overview') return ownerOverview(club);
        if (activeOwnerTab === 'tournaments') return ownerTournaments(club);
        if (activeOwnerTab === 'wall') return ownerWall(club);
        if (activeOwnerTab === 'team') return ownerTeam(club);
        if (activeOwnerTab === 'treasury') return ownerTreasury(club);
        return ownerSettings(club);
    }

    function ownerOverview(club) {
        const owned = tournaments.filter(function (item) { return item.organizerClubId === club.id; });
        const active = owned.filter(function (item) { return ['registration', 'live'].includes(item.status); }).length;
        const registrations = owned.reduce(function (sum, item) { return sum + Number(item.registrationCount ?? item.registrations.length); }, 0);
        return `<div class="owner-metrics"><article><small>Рейтинг</small><b>${Number(club.rating)}</b><span>городская позиция</span></article><article><small>Бойцы</small><b>${Number(club.members)}</b><span>команда заведения</span></article><article><small>Турниры</small><b>${active}</b><span>активны сейчас</span></article><article><small>Заявки</small><b>${registrations}</b><span>участников</span></article></div>
        <section class="owner-guide"><h3>Как работает арена заведения</h3><div><span>1</span><p><b>Создайте турнир</b>Выберите лигу, формат и условия.</p></div><div><span>2</span><p><b>Назначьте приз</b>Комбо, купон, подарок или фонд на проверку.</p></div><div><span>3</span><p><b>Проведите финал</b>Откройте сетку и подтвердите победителя.</p></div></section>
        ${canClub('manage_tournaments') ? '<button class="owner-primary" data-owner-action="new-tournament">+ Создать турнир</button>' : '<p class="owner-safety-note">Открыты только разделы, которые владелец клуба разрешил вам обслуживать.</p>'}`;
    }

    function ownerTournaments(club) {
        const owned = tournaments.filter(function (item) { return item.organizerClubId === club.id; });
        return `<div id="owner-form-slot"></div><div class="owner-list-head"><div><small>МОИ СОБЫТИЯ</small><h3>Турниры заведения</h3></div><button data-owner-action="new-tournament">+ Создать</button></div>
        <div class="owner-tournament-list">${owned.map(ownerTournamentCard).join('') || '<div class="empty">Создайте первый районный турнир</div>'}</div>`;
    }

    function ownerTournamentCard(tournament) {
        const poster = tournament.posterUrl ? `<img class="owner-tournament-poster" src="${esc(tournament.posterUrl)}" alt="Афиша ${esc(tournament.title)}">` : '';
        return `<article class="owner-tournament">${poster}<div><span>${tierNames[tournament.leagueTier]}</span><i>${statusNames[tournament.status] || tournament.status}</i></div><h3>${esc(tournament.title)}</h3><p>${esc(tournament.prizeTitle)} · ${Number(tournament.prizeAmount || 0)} SILARUM</p><small>${Number(tournament.registrationCount ?? tournament.registrations.length)}/${tournament.maxParticipants} участников · ${formatDate(tournament.startsAt)}</small>
        <div class="owner-card-actions">${tournament.status === 'registration' ? `<button data-start-bracket="${tournament.id}">Сформировать сетку</button>` : ''}<button data-owner-tournament="${tournament.id}">Подробнее</button></div>${renderBracket(tournament)}</article>`;
    }

    function renderBracket(tournament) {
        if (!Array.isArray(tournament.matches) || !tournament.matches.length) return '';
        return `<div class="mini-bracket"><small>ТУРНИРНАЯ СЕТКА</small>${tournament.matches.slice(0, 16).map(function (match) {
            const verify = match.status === 'submitted' && match.twoId ? `<em><button data-verify-match="${match.id}" data-winner-id="${match.oneId}">✓ ${esc(match.one)}</button><button data-verify-match="${match.id}" data-winner-id="${match.twoId}">✓ ${esc(match.two)}</button></em>` : '';
            return `<span><b>${esc(match.one)}</b><i>${match.status === 'verified' ? '✓' : 'VS'}</i><b>${esc(match.two)}</b></span>${verify}`;
        }).join('')}</div>`;
    }

    function tournamentForm(club) {
        const start = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 16);
        const registration = new Date(Date.now() + 5 * DAY).toISOString().slice(0, 16);
        return `<form id="owner-tournament-form" class="network-form owner-form"><div class="form-intro"><small>КОНСТРУКТОР ТУРНИРА</small><h3>Новое событие</h3><p>Мировой уровень и ценные призы отправятся главному администратору на проверку.</p></div>
        <label>Название<input required maxlength="120" name="title" placeholder="Кубок Hungry Wolves"></label>
        <label>Описание<textarea maxlength="2000" name="description" placeholder="Для кого и как проходит турнир"></textarea></label>
        <label>Афиша турнира<input type="file" name="poster" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG или WEBP, до 5 МБ</small></label>
        <div class="network-form-grid"><label>Уровень<select name="leagueTier"><option value="district">Район</option><option value="city">Город</option><option value="world">Мир</option></select></label><label>Дисциплина<select name="discipline"><option value="fight">Бойцы</option><option value="borsch">Крипто Борщ</option><option value="mixed">Обе</option></select></label></div>
        <div class="network-form-grid"><label>Формат<select name="format"><option value="knockout">На выбывание</option><option value="round_robin">Каждый с каждым</option><option value="groups_knockout">Группы + плей‑офф</option></select></label><label>Участников<input type="number" min="2" max="10000" name="maxParticipants" value="16"></label></div>
        <div class="network-form-grid"><label>Конец регистрации<input required type="datetime-local" name="registrationEndsAt" value="${registration}"></label><label>Начало<input required type="datetime-local" name="startsAt" value="${start}"></label></div>
        <div class="network-form-grid"><label>Мин. рейтинг<input type="number" min="0" name="minRating" value="0"></label><label>Возраст<input type="number" min="0" max="99" name="minAge" value="13"></label></div>
        <label>Условия участия<textarea required maxlength="5000" name="rules" placeholder="Количество раундов, проверка присутствия, правила ничьей"></textarea></label>
        <div class="network-form-grid"><label>Тип приза<select name="prizeType"><option value="food">Еда / купон</option><option value="physical">Ценный подарок</option><option value="digital">Цифровой приз</option><option value="silarum">Фонд SILARUM</option><option value="mixed">Смешанный</option></select></label><label>Расчётная единица<input name="prizeCurrency" value="SILARUM" readonly></label></div>
        <label>Название приза<input required maxlength="200" name="prizeTitle" placeholder="Комбо на двоих / смартфон / призовой фонд"></label>
        <label>Размер фонда или количество<input type="number" min="0" step="0.01" name="prizeAmount" value="1"></label>
        <label class="form-consent"><input required type="checkbox" name="prizeResponsibility"><span>Заведение подтверждает наличие приза и принимает ответственность за выдачу победителю.</span></label>
        <div class="owner-form-actions"><button type="submit">Сохранить турнир</button><button type="button" data-owner-action="cancel-form">Отмена</button></div></form>`;
    }

    function ownerWall(club) {
        const posts = publicNews.filter(function (item) { return item.clubId === club.id; })
            .sort(function (a, b) { return Number(b.publishedAt) - Number(a.publishedAt); });
        return `<form id="owner-news-form" class="network-form owner-form"><div class="form-intro"><small>ИНФОРМАЦИОННАЯ СТЕНА</small><h3>Новая публикация</h3><p>Афиши и новости сразу появляются в общей ленте клуба.</p></div>
        <label>Тип<select name="postType"><option value="news">Новость</option><option value="tournament">Турнир</option><option value="challenge">Вызов клуба</option><option value="result">Результат</option></select></label>
        <label>Заголовок<input required maxlength="160" name="title" placeholder="Большой бой в эту субботу"></label>
        <label>Описание<textarea maxlength="5000" name="body" placeholder="Время, место, правила и важная информация"></textarea></label>
        <label>Афиша<input type="file" name="poster" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG или WEBP, до 5 МБ</small></label>
        <button type="submit">Опубликовать</button></form>
        <div class="owner-feed">${posts.map(function (post) {
            return `<article>${post.posterUrl ? `<img src="${esc(post.posterUrl)}" alt="${esc(post.title)}">` : '<span>📣</span>'}<div><small>${formatDate(post.publishedAt)}</small><b>${esc(post.title)}</b><p>${esc(post.body || '')}</p></div></article>`;
        }).join('') || '<div class="empty">У клуба ещё нет публикаций</div>'}</div>`;
    }

    function rosterForClub(club) {
        if (clubRoster.length) return clubRoster;
        return [{
            club_id: club.id, telegram_user_id: currentUserId(), nickname: currentNickname(),
            role: 'owner', permissions: {}, fighter_key: localStorage.getItem('wolfSelectedFighter') || 'alpha',
            rating: 1200, wins: 0, losses: 0, status: 'active'
        }];
    }

    function roleName(role) {
        return ({ owner: 'Владелец', manager: 'Генеральный менеджер', section_manager: 'Руководитель направления', referee: 'Судья', fighter: 'Боец' })[role] || role;
    }

    function roleRank(role) {
        return ({ owner: 100, manager: 80, section_manager: 60, referee: 50, fighter: 10 })[role] || 0;
    }

    function ownerTeam(club) {
        const roster = rosterForClub(club).slice().sort(function (a, b) { return roleRank(b.role) - roleRank(a.role); });
        const delegates = roster.filter(function (member) { return member.role !== 'owner' && member.status === 'active'; });
        const opponents = networkClubs.filter(function (item) { return item.id !== club.id && item.status === 'verified'; });
        const clubOrders = clubMiningOrders.filter(function (item) { return item.clubId === club.id; });
        const ownChallenges = clubChallenges.filter(function (item) {
            return item.challengerClubId === club.id || item.defenderClubId === club.id;
        });
        const permissionFields = [
            ['manage_profile', 'Профиль'], ['manage_tournaments', 'Турниры'], ['manage_news', 'Стена'],
            ['manage_roster', 'Команда'], ['manage_mining', 'Майнинг'], ['manage_treasury', 'Казна'],
            ['manage_challenges', 'Вызовы'], ['redeem_rewards', 'Призы'], ['referee', 'Судья']
        ];
        const canRoster = canClub('manage_roster');
        const canMining = canClub('manage_mining');
        const canChallenges = canClub('manage_challenges');
        const isOwner = club.ownerTelegramId === currentUserId() || (currentUserId() === 0 && club.ownerName === currentNickname());
        return `<section class="owner-section-head"><small>БОЙЦЫ И ПРАВА</small><h3>Команда клуба</h3><p>Личный баланс бойца недоступен владельцу. Делегируются только отмеченные действия клуба.</p></section>
        <section class="club-hierarchy"><small>ИЕРАРХИЯ УПРАВЛЕНИЯ</small><div><span><b>1</b>Владелец<em>Все разделы и назначение прав</em></span><span><b>2</b>Генеральный менеджер<em>Управление клубом по выданным правам</em></span><span><b>3</b>Руководитель направления<em>Казна, турниры, медиа, майнинг или вызовы</em></span><span><b>4</b>Судья<em>Подтверждение результатов</em></span><span><b>5</b>Боец<em>Игры, турниры и добровольная поддержка</em></span></div></section>
        ${canRoster || canMining ? `<div class="club-roster-list">${roster.map(function (member) {
            return `<article><span>${member.role === 'owner' ? '👑' : member.role === 'manager' ? '🛡' : member.role === 'section_manager' ? '⚙' : member.role === 'referee' ? '⚖' : '🐺'}</span><div><b>${esc(member.nickname)}</b><small>${esc(roleName(member.role))} · рейтинг ${Number(member.rating || 1200)} · ${Number(member.wins || 0)}–${Number(member.losses || 0)}</small></div></article>`;
        }).join('')}</div>` : ''}
        ${isOwner ? (delegates.length ? `<form id="owner-permission-form" class="network-form compact-form"><h3>Доверенное лицо</h3><label>Участник<select name="memberTelegramUserId">${delegates.map(function (member) { return `<option value="${Number(member.telegram_user_id)}">${esc(member.nickname)}</option>`; }).join('')}</select></label><label>Уровень иерархии<select name="role"><option value="fighter">Боец</option><option value="section_manager">Руководитель направления</option><option value="manager">Генеральный менеджер</option><option value="referee">Судья</option></select></label><div class="permission-grid">${permissionFields.map(function (field) { return `<label><input type="checkbox" name="${field[0]}"><span>${field[1]}</span></label>`; }).join('')}</div><p class="owner-safety-note">Название роли показывает место в иерархии. Реальный доступ определяют только отмеченные разделы.</p><button type="submit">Сохранить права</button></form>` : '<p class="owner-safety-note">Назначить доверенное лицо можно после вступления второго участника в клуб.</p>') : ''}
        ${canMining ? `<form id="owner-mining-form" class="network-form compact-form"><h3>Отправить бойца в «Крипто Беспредел»</h3><label>Боец<select name="fighterTelegramUserId">${roster.filter(function (member) { return member.status === 'active'; }).map(function (member) { return `<option value="${Number(member.telegram_user_id)}">${esc(member.nickname)}</option>`; }).join('')}</select></label><label>Игровой пул<select name="poolId">${poolOptions.map(function (pool) { return `<option value="${esc(pool.id)}">${esc(pool.name)} · ${Number(pool.entry_srum_min)}–${Number(pool.entry_srum_max)} SILARUM</option>`; }).join('')}</select></label><div class="network-form-grid"><label>Вход SILARUM<input required type="number" min="0.01" step="0.01" name="entrySilarum" value="1"></label><label>Доля клуба с награды, %<input required type="number" min="0" max="100" step="1" name="rewardToClubPercent" value="50"></label></div><label class="form-consent"><input required type="checkbox"><span>Вход оплачивает клуб. Боец увидит сумму и долю клуба и должен подтвердить отправку.</span></label><button type="submit">Отправить запрос бойцу</button></form>
        <div class="mining-order-list">${clubOrders.slice(0, 10).map(function (order) { return `<article><b>Боец #${Number(order.fighterTelegramUserId)}</b><span>${Number(order.entrySilarum)} SILARUM · клубу ${Number(order.rewardToClubPercent)}%</span><i>${esc(order.fighterConsentStatus)} / ${esc(order.status)}</i>${['queued', 'active'].includes(order.status) ? `<button data-stop-mining-order="${order.id}">Завершить и вернуть остаток в казну</button>` : ''}</article>`; }).join('') || '<div class="empty">Поручений на майнинг пока нет</div>'}</div>` : ''}
        ${canChallenges ? `<form id="owner-challenge-form" class="network-form compact-form"><h3>Вызвать клуб на рейтинговый бой</h3><label>Соперник<select required name="defenderClubId">${opponents.map(function (item) { return `<option value="${esc(item.id)}">${esc(item.name)} · ${Number(item.rating)}</option>`; }).join('')}</select></label><label>Название<input required name="title" maxlength="160" placeholder="Битва двух районов"></label><label>Сообщение<textarea name="message" maxlength="2000" placeholder="Условия и место встречи"></textarea></label><div class="network-form-grid"><label>Дата<input required type="datetime-local" name="proposedStartsAt" value="${new Date(Date.now() + 7 * DAY).toISOString().slice(0, 16)}"></label><label>Формат<select name="format"><option value="single">Один бой</option><option value="best_of_3">До двух побед</option><option value="team_5x5">Команда 5×5</option></select></label></div><label>Очки рейтинга<input type="number" min="0" max="1000" name="ratingPoints" value="25"></label><button type="submit">Отправить вызов</button></form>
        <div class="challenge-manage-list">${ownChallenges.map(function (challenge) {
            const incoming = challenge.defenderClubId === club.id && challenge.status === 'pending';
            return `<article>${challengeCard(challenge)}${incoming ? `<div><button data-challenge-response="${challenge.id}" data-accepted="true">Принять</button><button data-challenge-response="${challenge.id}" data-accepted="false">Отклонить</button></div>` : ''}</article>`;
        }).join('') || '<div class="empty">Межклубных вызовов пока нет</div>'}</div>` : ''}`;
    }

    function ownerTreasury(club) {
        const catalog = clubPrizeCatalog.filter(function (item) { return (item.club_id || item.clubId) === club.id; });
        const exchanges = clubExchangeRequests.slice(0, 20);
        const campaign = clubContributionCampaign?.clubId === club.id ? clubContributionCampaign : null;
        const contributions = clubContributions.filter(function (item) { return (item.club_id || item.clubId) === club.id; }).slice(0, 20);
        const canTreasury = canClub('manage_treasury');
        const canTournaments = canClub('manage_tournaments');
        const canRewards = canClub('redeem_rewards');
        return `${canTreasury ? `<section class="treasury-hero"><div><small>КАЗНА КЛУБА</small><b>${Number(clubTreasury.silarumAvailable).toFixed(2)} SILARUM</b><span>Доступно</span></div><div><small>ЗАРЕЗЕРВИРОВАНО</small><b>${Number(clubTreasury.silarumLocked).toFixed(2)}</b><span>Турниры и обмен</span></div></section>
        <p class="owner-safety-note">Все входы, расчёты и призы клуба оплачиваются в SILARUM. 1 SILARUM = 10 000 RUMIR. TON/USDT появляются только после отдельной заявки, комиссии, газа и проверки.</p>
        <form id="owner-contribution-campaign-form" class="network-form compact-form"><h3>Добровольный взнос месяца</h3><label>Рекомендуемая сумма SILARUM<input required type="number" min="0.01" step="0.01" name="suggestedSilarum" value="${Number(campaign?.suggestedSilarum || 1)}"></label><label>Обращение администрации<textarea maxlength="500" name="message" placeholder="На турниры, афиши и развитие команды">${esc(campaign?.message || '')}</textarea></label><label class="form-consent"><input type="checkbox" name="enabled" ${campaign?.enabled !== false ? 'checked' : ''}><span>Показывать добровольную кампанию бойцам в этом месяце</span></label><button type="submit">Сохранить кампанию</button></form>
        <section class="contribution-summary"><div><small>СОБРАНО ЗА МЕСЯЦ</small><b>${Number(campaign?.totalSilarum || 0).toFixed(2)} SILARUM</b></div><div><small>ПОДДЕРЖАЛИ</small><b>${Number(campaign?.contributorCount || 0)}</b></div></section>
        <div class="contribution-list">${contributions.map(function (item) { return `<article><span>💚</span><div><b>${esc(item.nickname || 'Боец клуба')}</b><small>${Number(item.amount_silarum || item.amountSilarum)} SILARUM · ${formatDate(new Date(item.created_at || item.createdAt).getTime())}</small></div></article>`; }).join('') || '<div class="empty">Добровольных взносов пока нет</div>'}</div>
        <form id="owner-fund-form" class="network-form compact-form"><h3>Пополнить казну</h3><label>Сумма SILARUM<input required type="number" min="0.01" step="0.01" name="amountSilarum" value="10"></label><button type="submit">Перевести с моего игрового баланса</button></form>` : ''}
        ${canTournaments ? `<form id="owner-prize-form" class="network-form compact-form"><h3>Добавить приз в каталог</h3><label>Название<input required maxlength="200" name="title" placeholder="Комбо Hungry Wolves"></label><label>Описание<textarea maxlength="1000" name="description"></textarea></label><div class="network-form-grid"><label>Тип<select name="prizeType"><option value="food">Еда</option><option value="coupon">Купон</option><option value="physical">Подарок</option><option value="digital">Цифровой</option><option value="silarum">SILARUM</option></select></label><label>Цена SILARUM<input required type="number" min="0.01" step="0.01" name="priceSilarum"></label></div><label>Количество<input type="number" min="0" step="1" name="stock" value="1"></label><button type="submit">Добавить приз</button></form>
        <div class="prize-catalog-list">${catalog.map(function (item) { return `<article><span>${prizeIcon(item.prize_type || item.prizeType)}</span><div><b>${esc(item.title)}</b><small>${Number(item.price_silarum || item.priceSilarum)} SILARUM · остаток ${Number(item.stock || 0)}</small></div></article>`; }).join('') || '<div class="empty">Каталог призов пуст</div>'}</div>
        ` : ''}
        ${canRewards ? ownerRewards(club) : ''}
        ${canTreasury ? `
        <form id="owner-exchange-form" class="network-form compact-form"><h3>Заявка на обмен</h3><div class="network-form-grid"><label>Отдать SILARUM<input required type="number" min="0.01" step="0.01" name="amountSilarum"></label><label>Получить<select name="targetAsset"><option value="TON">TON</option><option value="USDT">USDT</option></select></label></div><label>Адрес кошелька<input required minlength="20" maxlength="200" name="destinationAddress" placeholder="Адрес TON-кошелька"></label><label class="form-consent"><input required type="checkbox"><span>Итоговая сумма будет рассчитана сервером: курс минус комиссия проекта и сетевой газ. Автоматическая отправка отключена до проверки заявки.</span></label><button type="submit" ${window.APP_CONFIG.cloudSyncEnabled ? '' : 'disabled'}>Запросить расчёт</button></form>
        <div class="exchange-list">${exchanges.map(function (item) { return `<article><b>${Number(item.amount_silarum)} SILARUM → ${esc(item.target_asset)}</b><span>К получению: ${Number(item.net_target_amount || 0)} · комиссия ${Number(item.service_commission_silarum || 0)} · газ ${Number(item.estimated_gas_target || 0)}</span><i>${esc(item.status)}</i>${item.status === 'pending_review' ? `<button data-cancel-club-exchange="${item.id}">Отменить и вернуть SILARUM</button>` : ''}</article>`; }).join('') || '<div class="empty">Заявок на обмен нет</div>'}</div>` : ''}`;
    }

    function ownerRewards(club) {
        const clubVouchers = vouchers.filter(function (voucher) { return voucher.clubId === club.id; });
        return `<section class="owner-reward-policy"><span>🎁</span><div><small>ПРИЗОВОЙ КОНТРОЛЬ</small><h3>Выдача наград</h3><p>Еду и купоны подтверждает сотрудник заведения. Дорогие подарки и финансовые фонды требуют проверки проекта.</p></div></section>
        <div class="voucher-list">${clubVouchers.map(function (voucher) { return `<article><span>${prizeIcon(voucher.prizeType)}</span><div><b>${esc(voucher.title)}</b><small>${esc(voucher.code)} · ${esc(voucher.winnerNickname)}</small></div><button data-redeem-voucher="${voucher.id}" ${voucher.status !== 'issued' ? 'disabled' : ''}>${voucher.status === 'issued' ? 'Погасить' : 'Выдан'}</button></article>`; }).join('') || '<div class="empty">Выданных призов пока нет</div>'}</div>`;
    }

    function ownerSettings(club) {
        return `<form id="owner-club-settings" class="network-form"><div class="form-intro"><small>ПРОФИЛЬ ЗАВЕДЕНИЯ</small><h3>${esc(club.venueName)}</h3></div><label>Название клуба<input required name="name" maxlength="80" value="${esc(club.name)}"></label><label>Описание<textarea name="description" maxlength="1000">${esc(club.description || '')}</textarea></label><label>Адрес<input name="address" maxlength="240" value="${esc(club.address || '')}"></label><button type="submit">Сохранить изменения</button><p class="owner-safety-note">Изменение города, страны или владельца требует повторной проверки главной админкой.</p></form>`;
    }

    function bindOwner(root) {
        if (root.dataset.ownerBound === 'true') return;
        root.dataset.ownerBound = 'true';
        root.addEventListener('click', function (event) {
            const tab = event.target.closest('[data-owner-tab]');
            if (tab) { activeOwnerTab = tab.dataset.ownerTab; renderOwnerDashboard(); return; }
            const action = event.target.closest('[data-owner-action]');
            if (action?.dataset.ownerAction === 'new-tournament') {
                activeOwnerTab = 'tournaments'; renderOwnerDashboard();
                document.getElementById('owner-form-slot').innerHTML = tournamentForm(getManagedClub());
            }
            if (action?.dataset.ownerAction === 'cancel-form') document.getElementById('owner-form-slot').innerHTML = '';
            const start = event.target.closest('[data-start-bracket]');
            if (start) startBracket(start.dataset.startBracket);
            const redeem = event.target.closest('[data-redeem-voucher]');
            if (redeem) redeemVoucher(redeem.dataset.redeemVoucher);
            const verify = event.target.closest('[data-verify-match]');
            if (verify && confirm('Подтвердить этого победителя? Решение изменит сетку и рейтинг.')) {
                cloudMutation('verify_tournament_match_result', {
                    matchId: verify.dataset.verifyMatch,
                    winnerTelegramUserId: Number(verify.dataset.winnerId)
                });
            }
            const challengeResponse = event.target.closest('[data-challenge-response]');
            if (challengeResponse) respondChallenge(challengeResponse.dataset.challengeResponse, challengeResponse.dataset.accepted === 'true');
            const stopMining = event.target.closest('[data-stop-mining-order]');
            if (stopMining && confirm('Завершить поручение после текущего раунда? Остаток клубного входа вернётся в казну.')) closeMiningOrder(stopMining.dataset.stopMiningOrder);
            const cancelExchange = event.target.closest('[data-cancel-club-exchange]');
            if (cancelExchange && confirm('Отменить заявку и вернуть SILARUM в казну?')) cancelClubExchange(cancelExchange.dataset.cancelClubExchange);
        });
        root.addEventListener('submit', function (event) {
            event.preventDefault();
            if (event.target.id === 'owner-tournament-form') createTournament(new FormData(event.target));
            if (event.target.id === 'owner-club-settings') saveClubSettings(new FormData(event.target));
            if (event.target.id === 'owner-news-form') publishNews(new FormData(event.target));
            if (event.target.id === 'owner-permission-form') saveMemberPermissions(new FormData(event.target));
            if (event.target.id === 'owner-mining-form') createMiningOrder(new FormData(event.target));
            if (event.target.id === 'owner-challenge-form') createChallenge(new FormData(event.target));
            if (event.target.id === 'owner-fund-form') fundTreasury(new FormData(event.target));
            if (event.target.id === 'owner-prize-form') createPrize(new FormData(event.target));
            if (event.target.id === 'owner-exchange-form') requestExchange(new FormData(event.target));
            if (event.target.id === 'owner-contribution-campaign-form') saveContributionCampaign(new FormData(event.target));
        });
    }

    async function createTournament(formData) {
        const club = getManagedClub();
        if (!club) return;
        const values = Object.fromEntries(formData.entries());
        const leagueTier = String(values.leagueTier);
        const prizeType = String(values.prizeType);
        const needsReview = leagueTier === 'world' || ['silarum', 'physical', 'digital', 'mixed'].includes(prizeType);
        let posterUrl = '';
        const posterFile = formData.get('poster');
        if (posterFile instanceof File && posterFile.size) {
            try {
                const uploaded = await uploadClubPoster(club.id, posterFile);
                posterUrl = String(uploaded.publicUrl || '');
            } catch (error) {
                return alert(`Не удалось загрузить афишу: ${error.message}`);
            }
        }
        const tournament = {
            id: uid('tour'), organizerClubId: club.id, title: String(values.title).trim().slice(0, 120),
            description: String(values.description || '').trim().slice(0, 2000), leagueTier,
            countryCode: club.countryCode, city: club.city, district: leagueTier === 'district' ? club.district : '',
            discipline: String(values.discipline), format: String(values.format),
            status: needsReview ? 'pending_review' : 'registration', approvalStatus: needsReview ? 'pending' : 'not_required',
            maxParticipants: Number(values.maxParticipants), minRating: Number(values.minRating), entrySilarum: 0,
            prizeType, prizeTitle: String(values.prizeTitle).trim().slice(0, 200), prizeAmount: Number(values.prizeAmount || 0),
            prizeCurrency: String(values.prizeCurrency), startsAt: new Date(String(values.startsAt)).getTime(),
            registrationEndsAt: new Date(String(values.registrationEndsAt)).getTime(), minAge: Number(values.minAge),
            rules: String(values.rules).trim().slice(0, 5000), posterUrl, registrations: [], matches: []
        };
        tournament.requiresQualification = leagueTier !== 'district';
        tournament.qualifyingTier = leagueTier === 'world' ? 'city' : (leagueTier === 'city' ? 'district' : null);
        if (!tournament.title || !tournament.prizeTitle || !tournament.rules || tournament.registrationEndsAt > tournament.startsAt) return alert('Проверьте название, правила и даты');
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('save_club_tournament', { tournament }, 'Турнир не сохранён');
            if (!saved) return;
        } else {
            tournaments.push(tournament);
            saveNetwork();
        }
        activeOwnerTab = 'tournaments';
        renderOwnerDashboard();
        alert(needsReview ? 'Турнир сохранён и отправлен главному администратору на проверку.' : 'Турнир опубликован. Регистрация открыта.');
    }

    async function publishNews(formData) {
        const club = getManagedClub();
        if (!club) return;
        const values = Object.fromEntries(formData.entries());
        let posterUrl = '';
        const posterFile = formData.get('poster');
        if (posterFile instanceof File && posterFile.size) {
            try {
                const uploaded = await uploadClubPoster(club.id, posterFile);
                posterUrl = String(uploaded.publicUrl || '');
            } catch (error) {
                return alert(`Не удалось загрузить афишу: ${error.message}`);
            }
        }
        const post = { id: uid('news'), clubId: club.id, postType: String(values.postType), title: String(values.title).trim().slice(0, 160), body: String(values.body || '').trim().slice(0, 5000), posterUrl, publishedAt: Date.now() };
        if (!post.title) return alert('Добавьте заголовок');
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('save_club_news', { clubId: club.id, postType: post.postType, title: post.title, body: post.body, posterUrl }, 'Публикация не сохранена');
            if (!saved) return;
        } else {
            publicNews.unshift(post);
            saveNetwork();
        }
        renderOwnerDashboard();
    }

    async function saveMemberPermissions(formData) {
        const club = getManagedClub();
        if (!club) return;
        const values = Object.fromEntries(formData.entries());
        const permissionKeys = ['manage_profile', 'manage_tournaments', 'manage_news', 'manage_roster', 'manage_mining', 'manage_treasury', 'manage_challenges', 'redeem_rewards', 'referee'];
        const permissions = Object.fromEntries(permissionKeys.map(function (key) { return [key, formData.has(key)]; }));
        const memberId = Number(values.memberTelegramUserId);
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('update_club_member_permissions', { clubId: club.id, memberTelegramUserId: memberId, role: String(values.role), permissions }, 'Права не сохранены');
            if (!saved) return;
        } else {
            const member = clubRoster.find(function (item) { return Number(item.telegram_user_id) === memberId; });
            if (member && member.role !== 'owner') { member.role = String(values.role); member.permissions = permissions; }
        }
        alert('Права доверенного лица сохранены.');
        renderOwnerDashboard();
    }

    async function createMiningOrder(formData) {
        const club = getManagedClub();
        if (!club) return;
        const values = Object.fromEntries(formData.entries());
        const order = { id: uid('mining'), clubId: club.id, fighterTelegramUserId: Number(values.fighterTelegramUserId), poolId: String(values.poolId), entrySilarum: Number(values.entrySilarum), rewardToClubPercent: Number(values.rewardToClubPercent), fighterConsentStatus: 'pending', status: 'pending_consent', createdAt: Date.now() };
        if (!Number.isFinite(order.entrySilarum) || order.entrySilarum <= 0 || order.rewardToClubPercent < 0 || order.rewardToClubPercent > 100) return alert('Проверьте сумму входа и долю клуба');
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('create_club_mining_order', order, 'Запрос на майнинг не создан');
            if (!saved) return;
        } else {
            clubMiningOrders.unshift(order);
            saveNetwork();
        }
        renderOwnerDashboard();
        alert('Запрос отправлен. SILARUM спишутся из казны только после согласия бойца.');
    }

    async function createChallenge(formData) {
        const club = getManagedClub();
        if (!club) return;
        const values = Object.fromEntries(formData.entries());
        const challenge = { id: uid('challenge'), challengerClubId: club.id, defenderClubId: String(values.defenderClubId), title: String(values.title).trim().slice(0, 160), message: String(values.message || '').trim().slice(0, 2000), proposedStartsAt: new Date(String(values.proposedStartsAt)).getTime(), format: String(values.format), ratingPoints: Number(values.ratingPoints), status: 'pending', winnerClubId: null };
        if (!challenge.title || !challenge.defenderClubId || challenge.proposedStartsAt <= Date.now()) return alert('Проверьте соперника, название и дату');
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('create_club_challenge', challenge, 'Вызов не отправлен');
            if (!saved) return;
        } else {
            clubChallenges.unshift(challenge);
            saveNetwork();
        }
        renderOwnerDashboard();
    }

    async function closeMiningOrder(orderId) {
        if (!window.APP_CONFIG.cloudSyncEnabled) {
            const order = clubMiningOrders.find(function (item) { return item.id === orderId; });
            if (order) order.status = 'completed';
            saveNetwork();
            renderOwnerDashboard();
            return;
        }
        const saved = await serverMutation('close_club_mining_order', { orderId }, 'Поручение ещё нельзя завершить');
        if (saved) renderOwnerDashboard();
    }

    async function respondChallenge(challengeId, accepted) {
        const challenge = clubChallenges.find(function (item) { return item.id === challengeId; });
        if (!challenge) return;
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('respond_club_challenge', { challengeId, accepted }, 'Ответ на вызов не сохранён');
            if (!saved) return;
        } else {
            challenge.status = accepted ? 'accepted' : 'declined';
            saveNetwork();
        }
        renderOwnerDashboard();
    }

    async function fundTreasury(formData) {
        const club = getManagedClub();
        const amount = Number(formData.get('amountSilarum'));
        if (!club || !Number.isFinite(amount) || amount <= 0) return alert('Укажите сумму пополнения');
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('fund_club_treasury', { clubId: club.id, amountSilarum: amount }, 'Казна не пополнена');
            if (!saved) return;
        } else {
            if (Number(window.srum || 0) < amount) return alert('Недостаточно SILARUM на игровом балансе');
            window.srum = Number(window.srum || 0) - amount;
            srum = window.srum;
            clubTreasury.silarumAvailable += amount;
            saveNetwork();
            if (typeof saveAll === 'function') saveAll();
            if (typeof updateUI === 'function') updateUI();
        }
        renderOwnerDashboard();
    }

    async function createPrize(formData) {
        const club = getManagedClub();
        if (!club) return;
        const values = Object.fromEntries(formData.entries());
        const prize = { id: uid('prize'), clubId: club.id, title: String(values.title).trim().slice(0, 200), description: String(values.description || '').trim().slice(0, 1000), prizeType: String(values.prizeType), priceSilarum: Number(values.priceSilarum), stock: Number(values.stock || 0) };
        if (!prize.title || !Number.isFinite(prize.priceSilarum) || prize.priceSilarum <= 0) return alert('Проверьте название и стоимость приза');
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('save_club_prize', { clubId: club.id, ...prize }, 'Приз не добавлен');
            if (!saved) return;
        } else {
            clubPrizeCatalog.unshift(prize);
            saveNetwork();
        }
        renderOwnerDashboard();
    }

    async function requestExchange(formData) {
        const club = getManagedClub();
        if (!club || !window.APP_CONFIG.cloudSyncEnabled) return alert('Обмен доступен только после подключения защищённого сервера.');
        const values = Object.fromEntries(formData.entries());
        const saved = await serverMutation('request_club_exchange', { clubId: club.id, amountSilarum: Number(values.amountSilarum), targetAsset: String(values.targetAsset), destinationAddress: String(values.destinationAddress).trim() }, 'Заявка не создана');
        if (!saved) return;
        alert('Заявка отправлена на расчёт курса, комиссии, газа и ручную проверку.');
    }

    async function saveContributionCampaign(formData) {
        const club = getManagedClub();
        if (!club) return;
        const campaign = {
            id: clubContributionCampaign?.id || uid('campaign'), clubId: club.id,
            monthStart: new Date().toISOString().slice(0, 7) + '-01',
            suggestedSilarum: Number(formData.get('suggestedSilarum')),
            message: String(formData.get('message') || '').trim().slice(0, 500),
            enabled: formData.has('enabled'),
            totalSilarum: Number(clubContributionCampaign?.totalSilarum || 0),
            contributorCount: Number(clubContributionCampaign?.contributorCount || 0)
        };
        if (!Number.isFinite(campaign.suggestedSilarum) || campaign.suggestedSilarum <= 0) return alert('Укажите рекомендуемую сумму');
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('save_club_contribution_campaign', {
                clubId: club.id, suggestedSilarum: campaign.suggestedSilarum,
                message: campaign.message, enabled: campaign.enabled
            }, 'Кампания не сохранена');
            if (!saved) return;
        } else {
            clubContributionCampaign = campaign;
            saveNetwork();
        }
        renderOwnerDashboard();
        alert(campaign.enabled ? 'Добровольная кампания опубликована для бойцов.' : 'Кампания этого месяца скрыта.');
    }

    async function contributeMonthly(formData) {
        const campaign = clubContributionCampaign;
        const club = getMemberClub();
        const amount = Number(formData.get('amountSilarum'));
        const publishOnWall = formData.has('publishOnWall');
        const requestId = requestUuid();
        if (!campaign || !club || !Number.isFinite(amount) || amount <= 0) return alert('Проверьте сумму поддержки');
        if (!confirm(`Добровольно внести ${amount.toFixed(2)} SILARUM в казну клуба?`)) return;
        if (window.APP_CONFIG.cloudSyncEnabled) {
            const saved = await serverMutation('contribute_club_monthly', {
                requestId, campaignId: campaign.id, amountSilarum: amount, publishOnWall
            }, 'Взнос не выполнен');
            if (!saved) return;
            const available = Number(saved.contribution?.srum_available);
            if (Number.isFinite(available)) { srum = available; window.srum = available; if (typeof updateUI === 'function') updateUI(); }
        } else {
            if (Number(window.srum || 0) < amount) return alert('Недостаточно SILARUM');
            window.srum = Number(window.srum || 0) - amount;
            srum = window.srum;
            clubTreasury.silarumAvailable += amount;
            campaign.totalSilarum += amount;
            const already = clubContributions.some(function (item) { return item.telegramUserId === currentUserId() && item.campaignId === campaign.id; });
            if (!already) campaign.contributorCount += 1;
            clubContributions.unshift({ id: requestId, campaignId: campaign.id, clubId: club.id, telegramUserId: currentUserId(), nickname: currentNickname(), amountSilarum: amount, publishOnWall, createdAt: Date.now() });
            if (publishOnWall) publicNews.unshift({ id: uid('news'), clubId: club.id, postType: 'contribution', title: `Спасибо, ${currentNickname()}!`, body: `Администрация клуба благодарит за добровольную поддержку: ${amount.toFixed(2)} SILARUM.`, posterUrl: '', publishedAt: Date.now() });
            saveNetwork();
            if (typeof updateUI === 'function') updateUI();
        }
        renderHub('my');
        alert('Спасибо! SILARUM поступили в казну клуба.');
    }

    async function cancelClubExchange(requestId) {
        const saved = await serverMutation('cancel_club_exchange', { requestId }, 'Заявка не отменена');
        if (saved) renderOwnerDashboard();
    }

    function saveClubSettings(formData) {
        const club = getManagedClub();
        if (!club) return;
        const values = Object.fromEntries(formData.entries());
        club.name = String(values.name).trim().slice(0, 80);
        club.description = String(values.description || '').trim().slice(0, 1000);
        club.address = String(values.address || '').trim().slice(0, 240);
        saveNetwork();
        cloudMutation('update_fight_club', { club });
        renderOwnerDashboard();
    }

    function startBracket(tournamentId) {
        const tournament = tournaments.find(function (item) { return item.id === tournamentId; });
        if (!tournament) return;
        if (window.APP_CONFIG.cloudSyncEnabled) {
            cloudMutation('start_club_tournament', { tournamentId });
            return;
        }
        const names = tournament.registrations.map(function (entry) { return entry.nickname; });
        const demoNames = ['HashWolf', 'TON Claw', 'Block Chef', 'Luna Byte', 'RumirFox', 'CryptoBear', 'PepperX', 'SolaKid'];
        let index = 0;
        while (names.length < Math.min(8, tournament.maxParticipants)) names.push(demoNames[index++ % demoNames.length]);
        if (names.length < 2) return alert('Нужно минимум два участника');
        tournament.matches = [];
        for (let i = 0; i < names.length; i += 2) tournament.matches.push({ id: uid('match'), round: 1, one: names[i], two: names[i + 1] || 'BYE', status: 'scheduled' });
        tournament.status = 'live';
        saveNetwork();
        renderOwnerDashboard();
    }

    function recordFightResult(won, context) {
        const tournamentId = context?.tournamentId || activeTournamentId;
        const tournament = tournaments.find(function (item) { return item.id === tournamentId; });
        if (!tournament) return null;
        const registration = tournament.registrations.find(function (entry) { return entry.telegramUserId === currentUserId(); });
        if (!registration) return null;
        if (window.APP_CONFIG.cloudSyncEnabled && context?.matchId) {
            registration.status = 'submitted';
            cloudMutation('submit_tournament_match_result', { matchId: context.matchId, won: Boolean(won) });
            saveNetwork();
            return { status: 'submitted', roundWins: 0, prize: null };
        }
        if (['winner', 'eliminated', 'withdrawn', 'disqualified'].includes(registration.status)) {
            return { status: registration.status, roundWins: registration.roundWins || 0, prize: registration.status === 'winner' ? tournament.prizeTitle : null };
        }
        if (won) {
            registration.roundWins = Number(registration.roundWins || 0) + 1;
            registration.status = registration.roundWins >= 2 ? 'winner' : 'checked_in';
            const club = getClub(registration.clubId);
            if (club) club.rating += registration.status === 'winner' ? 30 : 8;
            if (registration.status === 'winner' && !vouchers.some(function (item) { return item.tournamentId === tournament.id && item.winnerTelegramId === currentUserId(); })) {
                vouchers.push({
                    id: uid('voucher'), tournamentId: tournament.id, clubId: tournament.organizerClubId,
                    winnerTelegramId: currentUserId(), winnerNickname: currentNickname(), prizeType: tournament.prizeType,
                    title: tournament.prizeTitle, code: `WOLF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
                    status: 'issued', createdAt: Date.now()
                });
            }
        } else {
            registration.status = 'eliminated';
        }
        saveNetwork();
        return { status: registration.status, roundWins: registration.roundWins || 0, prize: registration.status === 'winner' ? tournament.prizeTitle : null };
    }

    function redeemVoucher(voucherId) {
        const voucher = vouchers.find(function (item) { return item.id === voucherId; });
        if (!voucher || voucher.status !== 'issued') return;
        if (!confirm(`Подтвердить выдачу приза «${voucher.title}»?`)) return;
        if (window.APP_CONFIG.cloudSyncEnabled) {
            cloudMutation('redeem_club_reward', { voucherId });
            return;
        }
        voucher.status = 'redeemed'; voucher.redeemedAt = Date.now();
        saveNetwork(); renderOwnerDashboard();
    }

    document.getElementById('club-tournaments-btn')?.addEventListener('click', function () { renderHub('tournaments'); });
    document.getElementById('club-news-btn')?.addEventListener('click', function () { renderHub('news'); });
    window.renderMyClub = function () { renderHub('leagues'); };
    window.ClubLeaguePlatform = {
        renderHub,
        renderOwnerDashboard,
        openOwnerDashboard,
        recordFightResult,
        getClubs: function () { return networkClubs.slice(); },
        getTournaments: function () { return tournaments.slice(); },
        sync: function () { syncFightHub(true); }
    };
})();
