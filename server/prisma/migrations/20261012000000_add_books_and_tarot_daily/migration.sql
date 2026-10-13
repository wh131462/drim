CREATE TABLE `books` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `author` VARCHAR(120) NOT NULL,
    `tag` VARCHAR(64) NOT NULL DEFAULT '',
    `price` VARCHAR(32) NOT NULL DEFAULT '',
    `cover_image` VARCHAR(512) NOT NULL,
    `description` TEXT NOT NULL,
    `reason` TEXT NOT NULL,
    `coming_soon` BOOLEAN NOT NULL DEFAULT false,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `books_published_deleted_at_sort_order_idx` (`published`, `deleted_at`, `sort_order`),
    INDEX `books_category_published_deleted_at_idx` (`category`, `published`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `book_favorites` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `book_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `book_favorites_user_id_book_id_key` (`user_id`, `book_id`),
    INDEX `book_favorites_book_id_created_at_idx` (`book_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `book_clicks` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `book_id` VARCHAR(191) NOT NULL,
    `request_id` VARCHAR(64) NOT NULL,
    `source` VARCHAR(24) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `book_clicks_user_id_request_id_key` (`user_id`, `request_id`),
    INDEX `book_clicks_book_id_created_at_idx` (`book_id`, `created_at`),
    INDEX `book_clicks_created_at_idx` (`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tarot_daily` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `card_id` INTEGER NOT NULL,
    `reversed` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tarot_daily_user_id_date_key` (`user_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `book_favorites` ADD CONSTRAINT `book_favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `book_favorites` ADD CONSTRAINT `book_favorites_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `book_clicks` ADD CONSTRAINT `book_clicks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `book_clicks` ADD CONSTRAINT `book_clicks_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tarot_daily` ADD CONSTRAINT `tarot_daily_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 首次迁移即可上架初始目录；后续种子不覆盖后台编辑。
INSERT INTO `books` (`id`, `category`, `title`, `author`, `tag`, `price`, `cover_image`, `description`, `reason`, `coming_soon`, `published`, `sort_order`, `updated_at`) VALUES
('dream-analysis', 'dream', '梦的解析', '西格蒙德·弗洛伊德', '潜意识', '¥49.00', '/assets/books/dream-analysis.jpg', '从梦的象征与线索出发，理解那些在夜里浮现的心事。', '适合从梦境中的象征和隐喻开始了解潜意识如何表达。', false, true, 1, CURRENT_TIMESTAMP(3)),
('jung-memoir', 'dream', '荣格自传：回忆·梦·思考', '卡尔·古斯塔夫·荣格', '荣格', '¥58.00', '/assets/books/jung-memoir.jpg', '一段将梦、象征与人生经验放在一起阅读的旅程。', '如果你常梦见水、飞行或未知空间，可以继续探索梦与象征。', false, true, 2, CURRENT_TIMESTAMP(3)),
('power-of-now', 'emotion', '当下的力量', '埃克哈特·托利', '情绪', '¥42.00', '/assets/books/power-of-now.jpg', '把注意力带回当下，给焦虑的思绪留出呼吸的空间。', '适合整理焦虑或反复的思绪，练习回到当下。', false, true, 3, CURRENT_TIMESTAMP(3)),
('talk-to-someone', 'emotion', '也许你该找个人聊聊', '洛莉·戈特利布', '情绪', '¥52.00', '/assets/books/talk-to-someone.jpg', '在真实故事里看见改变的可能，学会温柔地理解自己。', '适合从真实故事中整理情绪，找到被理解和改变的可能。', false, true, 4, CURRENT_TIMESTAMP(3)),
('attached', 'relationship', '依恋', '阿米尔·莱文 / 瑞秋·赫勒', '关系', '¥39.00', '/assets/books/attached.jpg', '认识亲密关系中的不同需要，找到更自在的连接方式。', '如果你常梦见亲人、争吵或关系拉扯，可以认识关系中的需要。', false, true, 5, CURRENT_TIMESTAMP(3)),
('courage-to-be-disliked', 'growth', '被讨厌的勇气', '岸见一郎 / 古贺史健', '成长', '¥45.00', '/assets/books/courage-to-be-disliked.jpg', '从阿德勒心理学出发，重新思考自由、关系与人生选择。', '适合继续探索自由、选择，以及如何减少对他人目光的顾虑。', false, true, 6, CURRENT_TIMESTAMP(3)),
('personality-puzzle', 'personality', '安静：内向性格的竞争力', '苏珊·凯恩', '人格', '即将上架', '/assets/books/personality-puzzle.jpg', '从不同性格的优势出发，理解自己与他人的沟通方式。', '适合在完成性格测试后，继续理解自己的能量来源和沟通习惯。', true, true, 7, CURRENT_TIMESTAMP(3));
