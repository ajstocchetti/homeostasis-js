BUCKET := ZZZZZ

#.PHONY

all: push

push:
	aws s3 cp app s3://$(BUCKET) --recursive
