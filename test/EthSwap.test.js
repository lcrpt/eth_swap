require('chai')
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('Token');
const EthSwap = artifacts.require('EthSwap');
const tokens = (n) => web3.utils.toWei(n, 'ether');

contract('EthSwap', ([deployer, investor]) => {
  let token, ethSwap;

  before(async () => {
    token = await Token.new();
    ethSwap = await EthSwap.new(token.address);
    await token.transfer(ethSwap.address, tokens('1000000'));
  });

  describe('Token deployement', async () => {
    it('contract has a name', async () => {
      const name = await token.name();

      assert.equal(name, 'DApp Token');
    });
  });

  describe('EthSwap deployement', async () => {
    it('contract has a name', async () => {
      const name = await ethSwap.name();

      assert.equal(name, 'EthSwap Instant Exchange');
    });

    it('contract has tokens', async () => {
      let balance = await token.balanceOf(ethSwap.address);

      assert.equal(balance.toString(), tokens('1000000'));
    });
  });

  describe('buyTokens()', async () => {
    let result;

    before(async () => {
      // Purchase 1 ETH before each tests
      result = await ethSwap.buyTokens({
        from: investor,
        value: tokens('1'),
      });
    });

    it('Allows users to instantly purchase tokens from ethSwap for a fixed price', async () => {
      // Check investor token balance after purchase
      const investorBalance = await token.balanceOf(investor);
      assert.equal(investorBalance.toString(), tokens('100'))

      // check ethSwap balance after purchase
      const ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens('999900'));

      // check balance
      const balance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(balance.toString(), tokens('1'));

      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens('100').toString());
      assert.equal(event.rate.toString(), '100');
    });
  });

  describe('sellTokens()', async () => {
    let result;

    before(async () => {
      // Investor must approve the purchase before selling his tokens
      await token.approve(ethSwap.address, tokens('100'), {
        from: investor,
      });

      result = await ethSwap.sellTokens(tokens('100'), {
        from: investor,
      });
    });

    it('Allows users to instantly sell tokens from ethSwap for a fixed price', async () => {
      // Check investor token balance after sell
      const investorBalance = await token.balanceOf(investor);
      assert.equal(investorBalance.toString(), tokens('0'))

      // check ethSwap balance after sell
      const ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens('1000000'));

      // check balance
      const balance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(balance.toString(), tokens('0'));

      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens('100').toString());
      assert.equal(event.rate.toString(), '100');

      // FAILURE: investor can't sell more tokens than they have
      await ethSwap.sellTokens(tokens('500'), {
        from: investor,
      }).should.be.rejected;
    });
  });
});



















//
