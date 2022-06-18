GNU_PREFIX =

CC=$(GNU_PREFIX)emcc
LD=$(GNU_PREFIX)ld

VERSION = $(shell git describe --tags --always --dirty)

DIST_PATH = dist
DIST_FILE = tama-wasm-$(VERSION).zip

RES_PATH = ../res

LDLIBS = 
CFLAGS += -Wall -g -sASYNCIFY -O3
EXPORTFLAGS += -sEXPORTED_FUNCTIONS=_void_tama_step,_void_tama_button,_u32t_tama_run_for,_statet_tama_get_cpu_state,_sizet_tama_get_cpu_state_size,_main -sEXPORTED_RUNTIME_METHODS=ccall,cwrap
PRELOAD_FILES = --preload-file tama.b

TARGET = tama

LIB_FOLDER = lib
LIB_SRCS = $(LIB_FOLDER)/tamalib.c $(LIB_FOLDER)/cpu.c $(LIB_FOLDER)/hw.c

SRCS = tama.c program.c
SRCS += $(LIB_SRCS)
OBJECTS = $(SRCS:.c=.o)

BUILD_FOLDER = build

OBJECTS := $(addprefix $(BUILD_FOLDER)/, $(OBJECTS))

all: $(TARGET)

dist: all
	@rm -rf $(DIST_PATH)
	@mkdir -p $(DIST_PATH)
	@install -s -m 0755 $(TARGET) $(DIST_PATH)
	@cp -a $(RES_PATH) $(DIST_PATH)/
	@rm -f $(DIST_FILE)
	@cd $(DIST_PATH) && zip -r ../$(DIST_FILE) *

dist-clean:
	@rm -rf $(DIST_PATH) $(DIST_FILE)

$(TARGET): $(BUILD_FOLDER) $(OBJECTS)
	@echo
	@echo -n "Linking ..."
	@$(CC) $(CFLAGS) $(LDFLAGS) $(PRELOAD_FILES) $(EXPORTFLAGS) $(OBJECTS) -o $(BUILD_FOLDER)/$@.html $(LDLIBS)
	@echo " -> $@"
	@echo

clean:
	$(RM) -rf $(BUILD_FOLDER) $(TARGET)

clean-all: dist-clean clean

$(BUILD_FOLDER):
	@mkdir -p $(BUILD_FOLDER)/lib

$(BUILD_FOLDER)/%.o : ./src/%.c
	@echo "[$@] ..."
	@$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_FOLDER)/lib/%.o : .src/lib/%.c
	@echo "[$@] ..."
	@$(CC) $(CFLAGS) -c $< -o $@

.PHONY: all dist dist-clean clean clean-all