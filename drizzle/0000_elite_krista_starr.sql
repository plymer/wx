CREATE TABLE `metars` (
	`siteId` varchar(4) NOT NULL,
	`validTime` datetime NOT NULL,
	`tt` float,
	`td` float,
	`windDir` int,
	`windSpd` int,
	`windGst` int,
	`vis` text,
	`wxString` text,
	`category` varchar(4),
	`rawText` text,
	CONSTRAINT `metars_siteId_validTime_pk` PRIMARY KEY(`siteId`,`validTime`)
);
--> statement-breakpoint
CREATE TABLE `pireps` (
	`validTime` datetime NOT NULL,
	`lat` float NOT NULL,
	`lon` float NOT NULL,
	`flightLevel` int,
	`aircraftType` varchar(10),
	`icg` varchar(10),
	`turb` varchar(10),
	`rawText` text NOT NULL,
	CONSTRAINT `pireps_lat_lon_validTime_pk` PRIMARY KEY(`lat`,`lon`,`validTime`)
);
--> statement-breakpoint
CREATE TABLE `sigmets` (
	`issueTime` datetime NOT NULL,
	`endTime` datetime NOT NULL,
	`charCode` varchar(20) NOT NULL DEFAULT '-',
	`numberCode` smallint NOT NULL DEFAULT 0,
	`initialShape` enum('polygon','line','point'),
	`speed` int,
	`initialCoords` text,
	`finalCoords` text,
	`rawText` text NOT NULL,
	`domain` text,
	`issuer` text,
	`firRegion` text,
	`header` varchar(6) NOT NULL DEFAULT 'TEMP',
	`hazard` text,
	`hazardTrend` enum('NC','INTSF','WKN'),
	`hazardBottom` text,
	`hazardTop` text,
	`direction` float,
	CONSTRAINT `sigmets_pk` PRIMARY KEY(`header`,`issueTime`,`charCode`,`numberCode`)
);
--> statement-breakpoint
CREATE TABLE `stations` (
	`name` varchar(45),
	`siteId` varchar(4) NOT NULL,
	`lat` float NOT NULL,
	`lon` float NOT NULL,
	`elev_f` float,
	`elev_m` float,
	`country` varchar(2),
	`state` varchar(2),
	CONSTRAINT `stations_siteId` PRIMARY KEY(`siteId`)
);
--> statement-breakpoint
CREATE TABLE `tafs` (
	`siteId` varchar(4) NOT NULL,
	`validTime` datetime NOT NULL,
	`rawText` text,
	CONSTRAINT `tafs_siteId_validTime_pk` PRIMARY KEY(`siteId`,`validTime`)
);
