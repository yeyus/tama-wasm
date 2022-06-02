#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>

#include "program.h"

u12_t * program_load(char *path, uint32_t *size)
{
  FILE *f;
	uint32_t i;
	uint8_t buf[2];
	u12_t *program;

	f = fopen("tama.b", "rb");
	if (f == NULL) {
		fprintf(stderr, "FATAL: Cannot open ROM \"%s\" !\n", path);
		return NULL;
	}

  fseek(f, 0L, SEEK_END);
	*size = ftell(f)/2;

  fseek(f, 0L, SEEK_SET);

	fprintf(stdout, "ROM size is %u * 12bits\n", *size);

	program = (u12_t *) malloc(*size * sizeof(u12_t));
	if (program == NULL) {
		fprintf(stderr, "FATAL: Cannot allocate ROM memory !\n");
		fclose(f);
		return NULL;
	}

	for (i = 0; i < *size; i++) {
		if (fread(buf, 2, 1, f) != 1) {
			fprintf(stderr, "FATAL: Cannot read program from ROM !\n");
			free(program);
			fclose(f);
			return NULL;
		}

		program[i] = buf[1] | ((buf[0] & 0xF) << 8);
	}

	fclose(f);
	return program;
}