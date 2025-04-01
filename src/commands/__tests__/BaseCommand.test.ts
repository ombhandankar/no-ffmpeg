import { BaseCommand } from "../BaseCommand";

/**
 * Mock implementation of BaseCommand for testing
 */
class MockCommand extends BaseCommand {
  constructor(program = "mock") {
    super(program);
  }

  validate(): boolean {
    return true;
  }
}

describe("BaseCommand", () => {
  let command: MockCommand;

  beforeEach(() => {
    command = new MockCommand("test-program");
  });

  it("should initialize with the correct program", () => {
    expect(command.getProgram()).toBe("test-program");
  });

  it("should add arguments correctly", () => {
    command.addArgs("-a", "value1", "-b", "value2");
    expect(command.getArgs()).toEqual(["-a", "value1", "-b", "value2"]);
  });

  it("should convert to string correctly", () => {
    command.addArgs("-a", "value1", "-b", "value2");
    expect(command.toString()).toBe("test-program -a value1 -b value2");
  });

  it("should return a copy of args to prevent mutation", () => {
    command.addArgs("-a", "value1");
    const args = command.getArgs();
    args.push("-modified");

    expect(command.getArgs()).toEqual(["-a", "value1"]);
  });
});
