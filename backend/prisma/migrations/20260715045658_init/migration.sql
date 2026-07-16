/*
  Warnings:

  - You are about to drop the column `organization_id` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `reminder_sent_at` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `application_status_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `certificates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `donations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feedbacks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `application_status_history` DROP FOREIGN KEY `application_status_history_application_id_fkey`;

-- DropForeignKey
ALTER TABLE `application_status_history` DROP FOREIGN KEY `application_status_history_changed_by_fkey`;

-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_application_id_fkey`;

-- DropForeignKey
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_checked_in_by_fkey`;

-- DropForeignKey
ALTER TABLE `certificates` DROP FOREIGN KEY `certificates_event_id_fkey`;

-- DropForeignKey
ALTER TABLE `certificates` DROP FOREIGN KEY `certificates_issued_by_fkey`;

-- DropForeignKey
ALTER TABLE `certificates` DROP FOREIGN KEY `certificates_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `donations` DROP FOREIGN KEY `donations_event_id_fkey`;

-- DropForeignKey
ALTER TABLE `donations` DROP FOREIGN KEY `donations_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_organization_id_fkey`;

-- DropForeignKey
ALTER TABLE `feedbacks` DROP FOREIGN KEY `feedbacks_application_id_fkey`;

-- DropForeignKey
ALTER TABLE `feedbacks` DROP FOREIGN KEY `feedbacks_event_id_fkey`;

-- DropForeignKey
ALTER TABLE `feedbacks` DROP FOREIGN KEY `feedbacks_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `payment_transactions` DROP FOREIGN KEY `payment_transactions_donation_id_fkey`;

-- DropIndex
DROP INDEX `events_organization_id_idx` ON `events`;

-- AlterTable
ALTER TABLE `events` DROP COLUMN `organization_id`,
    DROP COLUMN `reminder_sent_at`,
    ADD COLUMN `approved_at` DATETIME(3) NULL,
    ADD COLUMN `approved_by` INTEGER NULL,
    ADD COLUMN `rejected_reason` TEXT NULL,
    MODIFY `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- DropTable
DROP TABLE `application_status_history`;

-- DropTable
DROP TABLE `attendances`;

-- DropTable
DROP TABLE `certificates`;

-- DropTable
DROP TABLE `donations`;

-- DropTable
DROP TABLE `feedbacks`;

-- DropTable
DROP TABLE `notification_types`;

-- DropTable
DROP TABLE `notifications`;

-- DropTable
DROP TABLE `organizations`;

-- DropTable
DROP TABLE `payment_transactions`;

-- CreateIndex
CREATE INDEX `events_approved_by_idx` ON `events`(`approved_by`);

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
