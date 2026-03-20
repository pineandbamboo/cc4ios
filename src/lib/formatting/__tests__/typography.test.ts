import {
  spaceChineseLatin,
  spaceChineseNumber,
  normalizeQuotes,
  normalizePunctuation,
  formatTypography,
  needsTypographyFormatting,
} from "../typography";

describe("spaceChineseLatin", () => {
  it("should add space between Chinese and Latin characters", () => {
    expect(spaceChineseLatin("测试Test")).toBe("测试 Test");
    expect(spaceChineseLatin("Test测试")).toBe("Test 测试");
    expect(spaceChineseLatin("这是English测试")).toBe("这是 English 测试");
  });

  it("should handle multiple transitions", () => {
    expect(spaceChineseLatin("使用Claude Code开发")).toBe("使用 Claude Code 开发");
  });

  it("should not modify already spaced text", () => {
    expect(spaceChineseLatin("测试 Test")).toBe("测试 Test");
    expect(spaceChineseLatin("Test 测试")).toBe("Test 测试");
  });
});

describe("spaceChineseNumber", () => {
  it("should add space between Chinese and numbers", () => {
    expect(spaceChineseNumber("版本1")).toBe("版本 1");
    expect(spaceChineseNumber("1版本")).toBe("1 版本");
    expect(spaceChineseNumber("第2章")).toBe("第 2 章");
  });

  it("should handle multiple number transitions", () => {
    expect(spaceChineseNumber("2024年1月1日")).toBe("2024 年 1 月 1 日");
  });
});

describe("normalizeQuotes", () => {
  it("should convert quotes near Chinese text", () => {
    // Chinese opening quote
    expect(normalizeQuotes('他说"你好')).toBe("他说\u201c你好");
    // Chinese closing quote
    expect(normalizeQuotes('你好"他说')).toBe("你好\u201d他说");
  });
});

describe("normalizePunctuation", () => {
  it("should remove spaces before Chinese punctuation", () => {
    expect(normalizePunctuation("测试 ，")).toBe("测试，");
    expect(normalizePunctuation("测试 。")).toBe("测试。");
    expect(normalizePunctuation("测试 ！")).toBe("测试！");
  });

  it("should remove spaces after Chinese opening punctuation", () => {
    expect(normalizePunctuation("（ 测试")).toBe("（测试");
    expect(normalizePunctuation("【 测试")).toBe("【测试");
  });
});

describe("formatTypography", () => {
  it("should apply all formatting rules", () => {
    const input = "这是Test测试，版本1";
    const result = formatTypography(input);
    expect(result).toContain("Test");
    expect(result).toContain("版本");
    expect(result).toContain("1");
  });

  it("should not modify code blocks", () => {
    const input = "```const x = 'Test测试';```";
    expect(formatTypography(input)).toBe(input);
  });

  it("should not modify inline code", () => {
    const input = "Use `const x = 1` for testing";
    expect(formatTypography(input)).toBe(input);
  });

  it("should not modify URLs", () => {
    const input = "Visit https://example.com/test测试";
    expect(formatTypography(input)).toContain("https://example.com/test测试");
  });
});

describe("needsTypographyFormatting", () => {
  it("should detect Chinese followed by Latin", () => {
    expect(needsTypographyFormatting("测试Test")).toBe(true);
  });

  it("should detect Latin followed by Chinese", () => {
    expect(needsTypographyFormatting("Test测试")).toBe(true);
  });

  it("should detect Chinese followed by number", () => {
    expect(needsTypographyFormatting("版本1")).toBe(true);
  });

  it("should detect number followed by Chinese", () => {
    expect(needsTypographyFormatting("1版本")).toBe(true);
  });

  it("should return false for properly formatted text", () => {
    expect(needsTypographyFormatting("测试 Test 1 版本")).toBe(false);
  });

  it("should return false for pure Chinese text", () => {
    expect(needsTypographyFormatting("这是纯中文测试")).toBe(false);
  });

  it("should return false for pure English text", () => {
    expect(needsTypographyFormatting("This is pure English text")).toBe(false);
  });
});
