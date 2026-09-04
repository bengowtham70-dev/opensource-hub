class OpensourceHub < Formula
  desc "Find free open-source alternatives to the paid software you use"
  homepage "https://github.com/bengowtham70/opensource-hub"
  url "https://registry.npmjs.org/opensource-hub/-/opensource-hub-0.1.0.tgz"
  sha256 "PLACEHOLDER_TARBALL_SHA"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    bin.install libexec/"bin/cli.js" => "opensource-hub"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/opensource-hub --version")
  end
end
