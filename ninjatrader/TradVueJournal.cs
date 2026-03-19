// TradVue Auto-Journal for NinjaTrader 8
// 
// Sends ALL account trade executions to your TradVue journal automatically.
// Captures every fill — Chart Trader, manual orders, DOM, other strategies.
//
// Installation:
//   1. Copy this file to: Documents\NinjaTrader 8\bin\Custom\Strategies\
//   2. Open NinjaScript Editor → Compile (F5)
//   3. Add "TradVueJournal" strategy to any chart
//   4. Set the WebhookUrl parameter to your TradVue webhook URL
//   5. Enable the strategy — all fills auto-journal from this point
//
// Security:
//   - ONLY SENDS data (outbound HTTP POST). Cannot place/modify/cancel orders.
//   - Cannot access account balance or broker credentials.

#region Using declarations
using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using NinjaTrader.Cbi;
using NinjaTrader.NinjaScript;
using NinjaTrader.NinjaScript.Strategies;
#endregion

namespace NinjaTrader.NinjaScript.Strategies
{
    public class TradVueJournal : Strategy
    {
        private static readonly HttpClient httpClient = new HttpClient();
        private Account acct;
        
        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "TradVue Auto-Journal — sends all account executions to TradVue";
                Name = "TradVueJournal";
                Calculate = Calculate.OnBarClose;
                IsOverlay = true;
                
                WebhookUrl = "https://tradvue-api.onrender.com/api/webhook/nt/YOUR_TOKEN_HERE";
                SendEntries = true;
                SendExits = true;
                LogToOutput = true;
            }
            else if (State == State.DataLoaded)
            {
                // Subscribe to account-level execution events to capture ALL fills
                acct = Account;
                if (acct != null)
                {
                    acct.ExecutionUpdate += OnExecUpdate;
                    if (LogToOutput)
                        Print("[TradVue] Listening for executions on account: " + acct.Name);
                }
            }
            else if (State == State.Terminated)
            {
                if (acct != null)
                {
                    acct.ExecutionUpdate -= OnExecUpdate;
                    if (LogToOutput)
                        Print("[TradVue] Stopped listening");
                }
            }
        }
        
        protected override void OnBarUpdate()
        {
            // No bar processing — we only listen to account execution events
        }
        
        // Event signature from NT8 docs: (object sender, ExecutionEventArgs e)
        // ExecutionEventArgs provides: e.Execution, e.Quantity, e.Price
        // Execution provides: .Instrument, .MarketPosition, .Name, .Order, .OrderId, .Price, .Quantity, .Time
        private void OnExecUpdate(object sender, ExecutionEventArgs e)
        {
            try
            {
                var exec = e.Execution;
                if (exec == null) return;
                
                // Determine direction from execution's MarketPosition
                // MarketPosition.Long = bought (entry long or cover short)
                // MarketPosition.Short = sold (entry short or exit long)
                string direction = "";
                string action = "";
                
                if (exec.MarketPosition == MarketPosition.Long)
                {
                    direction = "Long";
                    action = "entry";
                }
                else if (exec.MarketPosition == MarketPosition.Short)
                {
                    direction = "Short";
                    action = "entry";
                }
                else
                {
                    direction = "Flat";
                    action = "exit";
                }
                
                if (action == "entry" && !SendEntries) return;
                if (action == "exit" && !SendExits) return;
                
                string symbol = exec.Instrument.MasterInstrument.Name;
                double price = exec.Price;
                int qty = exec.Quantity;
                DateTime time = exec.Time;
                string orderId = exec.OrderId ?? "";
                
                string assetClass = "Stock";
                if (exec.Instrument.MasterInstrument.InstrumentType == InstrumentType.Future)
                    assetClass = "Futures";
                else if (exec.Instrument.MasterInstrument.InstrumentType == InstrumentType.Forex)
                    assetClass = "Forex";
                
                string json = string.Format(
                    "{{" +
                    "\"ticker\":\"{0}\"," +
                    "\"action\":\"{1}\"," +
                    "\"direction\":\"{2}\"," +
                    "\"price\":{3}," +
                    "\"qty\":{4}," +
                    "\"asset_class\":\"{5}\"," +
                    "\"order_id\":\"{6}\"," +
                    "\"time\":\"{7}\"," +
                    "\"source\":\"ninjatrader\"" +
                    "}}",
                    symbol,
                    action,
                    direction,
                    price.ToString("F6"),
                    qty,
                    assetClass,
                    orderId,
                    time.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                );
                
                SendAsync(json, symbol, action, direction, price, qty);
            }
            catch (Exception ex)
            {
                if (LogToOutput)
                    Print("[TradVue] Error processing execution: " + ex.Message);
            }
        }
        
        private async void SendAsync(string json, string symbol, string action,
            string direction, double price, int qty)
        {
            try
            {
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync(WebhookUrl, content);
                
                if (LogToOutput)
                {
                    if (response.IsSuccessStatusCode)
                    {
                        Print(string.Format("[TradVue] {0} {1} {2} {3}x @ {4:F2} — sent OK",
                            action.ToUpper(), direction, symbol, qty, price));
                    }
                    else
                    {
                        string body = await response.Content.ReadAsStringAsync();
                        Print(string.Format("[TradVue] ERROR {0}: {1}",
                            (int)response.StatusCode, body));
                    }
                }
            }
            catch (Exception ex)
            {
                if (LogToOutput)
                    Print("[TradVue] Send failed: " + ex.Message);
            }
        }

        #region Properties
        [NinjaScriptProperty]
        [Display(Name = "Webhook URL", Description = "Your TradVue webhook URL (from Integrations page)",
            Order = 1, GroupName = "TradVue Settings")]
        public string WebhookUrl { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Send Entries", Description = "Send entry fills to TradVue",
            Order = 2, GroupName = "TradVue Settings")]
        public bool SendEntries { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Send Exits", Description = "Send exit fills to TradVue",
            Order = 3, GroupName = "TradVue Settings")]
        public bool SendExits { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Log to Output", Description = "Show confirmations in NinjaTrader Output window",
            Order = 4, GroupName = "TradVue Settings")]
        public bool LogToOutput { get; set; }
        #endregion
    }
}
