import ts from 'typescript';
import * as tstl from 'typescript-to-lua';

const mainLuaCode = `
local function requireSpecsRecursive(folder)
    folder = folder or ""
    for _, item in ipairs(love.filesystem.getDirectoryItems(folder)) do
        local path = folder == "" and item or folder .. "/" .. item
        if love.filesystem.getInfo(path, "file") then
            if path:match("%-spec%.lua$") then
                local modulePath = path:gsub("%.lua$", ""):gsub("/", ".")
                require(modulePath)
            end
        elseif love.filesystem.getInfo(path, "directory") then
            requireSpecsRecursive(path)
        end
    end
end

requireSpecsRecursive()


require("lua_modules/@keyslam/testing/dist/test-runner").run()

love.event.quit()
`;

const confLuaCode = `
ffi = require("ffi")

local IS_DEBUG = os.getenv("LOCAL_LUA_DEBUGGER_VSCODE") == "1" and arg[2] == "debug"
if IS_DEBUG then
    local protectedContextCount = 0

    local function start()
        local pcall_old = pcall
        local xpcall_old = xpcall
        local error_old = error
        local assert_old = assert

        _G.pcall = function(...)
            protectedContextCount = protectedContextCount + 1
            local results = { pcall_old(...) }
            protectedContextCount = protectedContextCount - 1

            return unpack(results)
        end

        _G.xpcall = function(...)
            protectedContextCount = protectedContextCount + 1
            local results = { xpcall_old(...) }
            protectedContextCount = protectedContextCount - 1

            return unpack(results)
        end

        local lldebugger = require("lldebugger").start()
        local error_lldebugger = error
        local assert_lldebugger = assert

        _G.error = function(...)
            if (protectedContextCount == 0) then
                return error_lldebugger(...)
            end

            return error_old(...)
        end

        _G.assert = function(...)
            if (protectedContextCount == 0) then
                return assert_lldebugger(...)
            end

            return assert_old(...)
        end

        return lldebugger
    end

    local function useLove()
        protectedContextCount = protectedContextCount - 1
    end

    start()

	function love.errorhandler(msg)
		error(msg, 2)
	end
end

function love.conf(t)
	t.identity              = nil
	t.appendidentity        = false
	t.version               = "11.5"
	t.console               = false
	t.accelerometerjoystick = false
	t.externalstorage       = false
	t.gammacorrect          = false

	t.audio.mic             = false
	t.audio.mixwithsystem   = true

	t.window = nil

	t.modules.audio         = false
	t.modules.data          = false
	t.modules.event         = true
	t.modules.font          = false
	t.modules.graphics      = false
	t.modules.image         = false
	t.modules.joystick      = false
	t.modules.keyboard      = false
	t.modules.math          = false
	t.modules.mouse         = false
	t.modules.physics       = false
	t.modules.sound         = false
	t.modules.system        = false
	t.modules.thread        = false
	t.modules.timer         = true
	t.modules.touch         = false
	t.modules.video         = false
	t.modules.window        = false
end
`;

function rewriteSpecFileName(file: tstl.EmitFile): void {
    file.outputPath = file.outputPath.replace(/\.spec\./, '-spec.');
}

function rewriteSpecFileNames(files: tstl.EmitFile[]): void {
    for (const file of files) {
        rewriteSpecFileName(file);
    }
}

function createMainFile(options: tstl.CompilerOptions, files: tstl.EmitFile[]): void {
    const outputPath = options.outDir //
        ? `${options.outDir}/main.lua`
        : 'main.lua';

    files.push({
        outputPath: outputPath,
        code: mainLuaCode,
    });
}

function createConfFile(options: tstl.CompilerOptions, files: tstl.EmitFile[]): void {
    const outputPath = options.outDir //
        ? `${options.outDir}/conf.lua`
        : 'conf.lua';

    files.push({
        outputPath: outputPath,
        code: confLuaCode,
    });
}

const plugin: tstl.Plugin = {
    beforeEmit(
        program: ts.Program,
        options: tstl.CompilerOptions,
        emitHost: tstl.EmitHost,
        result: tstl.EmitFile[]
    ): void {
        rewriteSpecFileNames(result);
        createConfFile(options, result);
        createMainFile(options, result);
    },
};

export default plugin;
