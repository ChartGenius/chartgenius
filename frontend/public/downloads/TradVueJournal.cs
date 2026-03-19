// TradVue Auto-Journal for NinjaTrader 8
// 
// This strategy addon sends your real trade executions to TradVue automatically.
// It fires ONLY on actual broker fills — real entry/exit prices, real quantities.
//
// Installation:
//   1. In NinjaTrader 8: Tools → Import → NinjaScript Add-On
//   2. Select this file (TradVueJournal.cs)
//   3. Go to Strategies tab → add "TradVueJournal" to your chart/workspace
//   4. Set the WebhookUrl parameter to your TradVue webhook URL
//   5. Enable the strategy — trades auto-journal from this point forward
//
// Security:
//   - This addon ONLY SENDS data (outbound HTTP POST)
//   - It CANNOT place, modify, or cancel any orders
//   - It CANNOT access your account balance or broker credentials
//   - It reads only execution data that NinjaTrader provides on fills
//
// Data sent per execution:
//   - Symbol, price, quantity, direction (Long/Short), time
//   - Order ID (for matching entries to exits)
//   - NO account numbers, NO credentials, NO balance info

#region Using declarations
using System;
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
        private string lastEntryOrderId = null;
        private double lastEntryPrice = 0;
        private int lastEntryQty = 0;
        private string lastEntryDirection = null;
        private DateTime lastEntryTime = DateTime.MinValue;
        
        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "TradVue Auto-Journal — sends real trade executions to your TradVue account";
                Name = "TradVueJournal";
                Calculate = Calculate.OnEachTick;
                IsOverlay = true;
                IsUnmanaged = true;
                
                // User-configurable parameters
                WebhookUrl = "https://tradvue-api.onrender.com/api/webhook/tv/YOUR_TOKEN_HERE";
                SendEntries = true;
                SendExits = true;
                LogToOutput = true;
            }
            else if (State == State.Configure)
            {
                // Nothing to configure
            }
            else if (State == State.Terminated)
            {
                // Cleanup
            }
        }

        protected override void OnExecutionUpdate(Execution execution, string executionId, 
            double price, int quantity, MarketPosition marketPosition, 
            string orderId, DateTime time)
        {
            if (execution == null || execution.Order == null) return;
            
            var order = execution.Order;
            
            // Only process filled orders
            if (order.OrderState != OrderState.Filled && order.OrderState != OrderState.PartFilled) return;
            
            // Determine if this is an entry or exit
            string action = "";
            string direction = "";
            double entryPrice = 0;
            double exitPrice = 0;
            double pnl = 0;
            
            if (order.IsEntry || order.Name.Contains("Entry"))
            {
                // This is an ENTRY fill
                action = "entry";
                direction = marketPosition == MarketPosition.Long ? "Long" : "Short";
                entryPrice = price;
                
                // Track for matching with exit
                lastEntryOrderId = orderId;
                lastEntryPrice = price;
                lastEntryQty = quantity;
                lastEntryDirection = direction;
                lastEntryTime = time;
                
                if (!SendEntries) return;
            }
            else
            {
                // This is an EXIT fill
                action = "exit";
                exitPrice = price;
                entryPrice = lastEntryPrice;
                direction = lastEntryDirection ?? (marketPosition == MarketPosition.Long ? "Short" : "Long");
                
                // Calculate P&L
                if (entryPrice > 0)
                {
                    if (direction == "Long")
                        pnl = (exitPrice - entryPrice) * quantity;
                    else
                        pnl = (entryPrice - exitPrice) * quantity;
                    
                    // Adjust for futures tick value
                    if (Instrument.MasterInstrument.InstrumentType == InstrumentType.Future)
                    {
                        pnl = pnl * Instrument.MasterInstrument.PointValue;
                    }
                }
                
                if (!SendExits) return;
            }
            
            // Build JSON payload
            string symbol = Instrument.MasterInstrument.Name;
            string assetClass = Instrument.MasterInstrument.InstrumentType == InstrumentType.Future 
                ? "Futures" 
                : Instrument.MasterInstrument.InstrumentType == InstrumentType.Forex 
                    ? "Forex" 
                    : "Stock";
            
            string json = string.Format(
                "{{" +
                "\"ticker\":\"{0}\"," +
                "\"action\":\"{1}\"," +
                "\"direction\":\"{2}\"," +
                "\"price\":{3}," +
                "\"entry_price\":{4}," +
                "\"exit_price\":{5}," +
                "\"qty\":{6}," +
                "\"pnl\":{7}," +
                "\"asset_class\":\"{8}\"," +
                "\"order_id\":\"{9}\"," +
                "\"time\":\"{10}\"," +
                "\"source\":\"ninjatrader\"" +
                "}}",
                symbol,
                action,
                direction,
                price.ToString("F4"),
                entryPrice > 0 ? entryPrice.ToString("F4") : "null",
                exitPrice > 0 ? exitPrice.ToString("F4") : "null",
                quantity,
                Math.Round(pnl, 2).ToString("F2"),
                assetClass,
                orderId ?? "",
                time.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            );
            
            // Send async — don't block the execution thread
            SendWebhookAsync(json, symbol, action, price, quantity, time);
        }
        
        private async void SendWebhookAsync(string json, string symbol, string action, 
            double price, int qty, DateTime time)
        {
            try
            {
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync(WebhookUrl, content);
                
                if (LogToOutput)
                {
                    if (response.IsSuccessStatusCode)
                    {
                        Print(string.Format("[TradVue] {0} {1} {2}x @ {3:F2} — sent OK", 
                            action.ToUpper(), symbol, qty, price));
                    }
                    else
                    {
                        Print(string.Format("[TradVue] ERROR {0}: {1}", 
                            (int)response.StatusCode, await response.Content.ReadAsStringAsync()));
                    }
                }
            }
            catch (Exception ex)
            {
                if (LogToOutput)
                    Print(string.Format("[TradVue] Send failed: {0}", ex.Message));
            }
        }

        #region Properties
        [NinjaScriptProperty]
        [Display(Name = "Webhook URL", Description = "Your TradVue webhook URL (from TradVue → Journal → Connect NinjaTrader)", 
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
        [Display(Name = "Log to Output", Description = "Show send confirmations in NinjaTrader Output window", 
            Order = 4, GroupName = "TradVue Settings")]
        public bool LogToOutput { get; set; }
        #endregion
    }
}
