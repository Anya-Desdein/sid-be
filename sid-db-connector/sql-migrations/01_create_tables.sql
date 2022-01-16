
CREATE TABLE public.output_devices
(
    "id" character varying(64) NOT NULL,
    "displayName" character varying(120) NOT NULL,
    "controllerId" character varying(120),
    "controllerData" character varying(16000),
    "currentState" boolean,
    "overrideState" boolean,
    CONSTRAINT output_devices_pkey PRIMARY KEY (id)
)

-- tabela sensors jest zdenormalizowana przez
-- posiadanie wartoci latestValue i latestReadingDate
-- dla szybszego odczytu z tabeli sensors
CREATE TABLE public.sensors
(
    "id" character varying(64) NOT NULL,
    "type" character varying(16) NOT NULL,
    "displayName" character varying(120) NOT NULL,
    "latestValue" double precision,
    "latestReadingDate" timestamp with time zone,
    CONSTRAINT sensors_pkey PRIMARY KEY (id)
)

CREATE TABLE public.sensor_history
(
    "id" bigserial NOT NULL,
    "sensorId" character varying(64) NOT NULL,
    "value" double precision NOT NULL,
    "readingDate" timestamp with time zone NOT NULL,
    CONSTRAINT sensor_history_pkey PRIMARY KEY (id)
)
