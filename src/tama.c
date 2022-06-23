#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <time.h>

#include "lib/tamalib.h"
#include "program.h"

#define TIMER_1HZ_PERIOD 32768
#define ROM_PATH			"/tama.b"
#define SLEEP_BYPASS 1

static u8_t log_levels = /* LOG_MEMORY | LOG_CPU | */ LOG_ERROR | LOG_INFO;
static u12_t *g_program = NULL;		// The actual program that is executed
static uint32_t g_program_size = 0;
static breakpoint_t *g_breakpoints = NULL;

static void * hal_malloc(u32_t size)
{
	return malloc(size);
}

static void hal_free(void *ptr)
{
	free(ptr);
}

static void hal_halt(void)
{
	exit(EXIT_SUCCESS);
}

static bool_t hal_is_log_enabled(log_level_t level)
{
	return !!(log_levels & level);
}

static void hal_log(log_level_t level, char *buff, ...)
{
	va_list arglist;

	if (!(log_levels & level)) {
		return;
	}

	va_start(arglist, buff);

	vfprintf((level == LOG_ERROR) ? stderr : stdout, buff, arglist);

	va_end(arglist);
}

static timestamp_t hal_get_timestamp(void)
{
	struct timespec time;

	clock_gettime(CLOCK_REALTIME, &time);
	return (time.tv_sec * 1000000 + time.tv_nsec/1000);
}

static void hal_sleep_until(timestamp_t ts)
{
#ifdef SLEEP_BYPASS
	return;
#endif

#ifndef NO_SLEEP
	struct timespec t;
	int32_t remaining = (int32_t) (ts - hal_get_timestamp());

	/* Sleep for a bit more than what is needed */
	if (remaining > 0) {
		t.tv_sec = remaining / 1000000;
		t.tv_nsec = (remaining % 1000000) * 1000;
		nanosleep(&t, NULL);
	}
#else
	/* Wait instead of sleeping to get the highest possible accuracy
	 * NOTE: the accuracy still depends on the timestamp_t resolution.
	 */
	while ((int32_t) (ts - hal_get_timestamp()) > 0);
#endif
}

static void hal_update_screen(void)
{
	// TODO
  hal_log(LOG_INFO, "hal_update_screen\n");
}

EM_JS(void, set_lcd_matrix, (u8_t x, u8_t y, bool_t val), {
	Module && Module.tamaLib && Module.tamaLib.setLCDMatrix(x, y, val);
});

static void hal_set_lcd_matrix(u8_t x, u8_t y, bool_t val)
{
	// TODO
  // hal_log(LOG_INFO, "hal_set_lcd_matrix, x: %d y: %d val: %d\n", x, y, val);
	set_lcd_matrix(x, y, val);
}

EM_JS(void, set_lcd_icon, (u8_t icon, bool_t val), {
	Module && Module.tamaLib && Module.tamaLib.setLCDIcon(icon, val);
});

static void hal_set_lcd_icon(u8_t icon, bool_t val)
{
	// TODO
  //hal_log(LOG_INFO, "hal_set_lcd_icon, icon: %d val: %d\n", icon, val);
	set_lcd_icon(icon, val);
}

EM_JS(void, set_audio_frequency, (u32_t freq), {
	Module && Module.tamaLib && Module.tamaLib.setAudioFrequency(freq);
});

static void hal_set_frequency(u32_t freq)
{
	// TODO
  //hal_log(LOG_INFO, "hal_set_frequency, freq: %d\n", freq);
	set_audio_frequency(freq);
}

EM_JS(void, set_audio_play, (bool_t en), {
	Module && Module.tamaLib && Module.tamaLib.setAudioPlay(en);
});


static void hal_play_frequency(bool_t en)
{
	// TODO
  //hal_log(LOG_INFO, "hal_play_frequency, play: %d\n", en);
	set_audio_play(en);
}

static int hal_handler(void)
{
	// TODO
  hal_log(LOG_INFO, "hal_handler");
  return 0;
}

static hal_t hal = {
	.malloc = &hal_malloc,
	.free = &hal_free,
	.halt = &hal_halt,
	.is_log_enabled = &hal_is_log_enabled,
	.log = &hal_log,
	.sleep_until = &hal_sleep_until,
	.get_timestamp = &hal_get_timestamp,
	.update_screen = &hal_update_screen,
	.set_lcd_matrix = &hal_set_lcd_matrix,
	.set_lcd_icon = &hal_set_lcd_icon,
	.set_frequency = &hal_set_frequency,
	.play_frequency = &hal_play_frequency,
	.handler = &hal_handler,
};

/**
 * @brief Exported function that allows javascript to control the stepping into the code
 */
void void_tama_step(u32_t steps) {
	if (steps < 1) return;
	for(u32_t i = 0; i < steps; i++) {
		tamalib_set_exec_mode(EXEC_MODE_STEP);
  	tamalib_step();
	}
}

/**
 * @brief Exported function that allows running the cpu for a certain amount of milliseconds
 * 
 * @param ms - milliseconds the cpu will be running without stopping
 * @returns number of steps advancing
 */
u32_t u32t_tama_run_for(u32_t ms) {
	if (ms < 1) return 0;
	// 32768 ticks per 1000ms
	u32_t run_for = TIMER_1HZ_PERIOD * ms / 1000;
	state_t *state = tamalib_get_state();
	u32_t target_ts = *(state->tick_counter) + run_for;
	u32_t steps = 0;
	while (*(state->tick_counter) < target_ts) {
		tamalib_set_exec_mode(EXEC_MODE_STEP);
		tamalib_step();
		steps++;
		state = tamalib_get_state();
	}

	return steps;
}

/**
 * @brief Exported function that allows javascript to control button press
 */
void void_tama_button(button_t btn, btn_state_t state) {
	tamalib_set_button(btn, state);
}

/**
 * @brief dump the cpu state pointer
 * 
 * @return state_t*
 */
state_t * statet_tama_get_cpu_state() {
	return tamalib_get_state();
}

size_t * sizet_tama_get_cpu_state_size() {
	return sizeof(state_t);
}

int main() {
  char rom_path[256] = ROM_PATH;

  tamalib_register_hal(&hal);

  g_program = program_load(rom_path, &g_program_size);
	if (g_program == NULL) {
		hal_log(LOG_ERROR, "FATAL: Error while loading ROM %s !\n", rom_path);
		tamalib_free_bp(&g_breakpoints);
		return -1;
	}

  if (tamalib_init(g_program, g_breakpoints, 1000000)) {
		hal_log(LOG_ERROR, "FATAL: Error while initializing tamalib !\n");
		free(g_program);
		tamalib_free_bp(&g_breakpoints);
		return -1;
	}

  //tamalib_mainloop();
	//tamalib_set_exec_mode(EXEC_MODE_STEP);

	while(1) {
		hal_log(LOG_INFO, "main loop\n");
		emscripten_sleep(1000);
	};

  tamalib_release();
  free(g_program);
  tamalib_free_bp(&g_breakpoints);
  return 0;
}