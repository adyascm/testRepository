/*This file will be used to track all the schema changes so that it is easy to update the DB during upgrades*/

/*May'18 release*/
ALTER TABLE application
ADD timestamp DateTime;

CREATE TABLE `datasource_credentials` (
  `datasource_id` varchar(36) NOT NULL,
  `credentials` text,
  `created_user` varchar(320) DEFAULT NULL,
  PRIMARY KEY (`datasource_id`),
  CONSTRAINT `datasource_credentials_ibfk_1` FOREIGN KEY (`datasource_id`) REFERENCES `datasource` (`datasource_id`)
);

CREATE TABLE `trusted_entities` (
  `domain_id` varchar(255) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trusted_domains` text,
  `trusted_apps` text,
  PRIMARY KEY (`id`),
  KEY `domain_id` (`domain_id`),
  CONSTRAINT `trusted_entities_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `domain` (`domain_id`)
);

ALTER TABLE audit_log
ADD message varchar(500) DEFAULT NULL,
ADD status varchar(50) DEFAULT NULL;

ALTER TABLE policy
ADD severity varchar(255) DEFAULT NULL;

ALTER TABLE domain_user 
ADD last_login_time DateTime;

ALTER TABLE application 
ADD inactive_users int,
ADD image_url text,
ADD category varchar(255);

ALTER TABLE application
ADD is_whitelisted Boolean

ALTER TABLE report
ADD is_non_editable Boolean