import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile System
  public type UserProfile = {
    name : Text;
    phone : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types
  public type Package = {
    id : Nat;
    name : Text;
    priceUsd : Nat;
  };

  public type Subscriber = {
    id : Nat;
    fullName : Text;
    phone : Text;
    packageId : Nat;
    active : Bool;
    subscriptionStartDate : Time.Time;
  };

  public type MonthStatus = {
    due : Bool;
    paid : Bool;
  };

  public type MonthlyBilling = Map.Map<Nat, MonthStatus>;
  public type YearlyBilling = Map.Map<Nat, MonthlyBilling>;

  // Immutable Views
  public type MonthStatusView = {
    due : Bool;
    paid : Bool;
  };

  public type BillingEntryView = {
    year : Nat;
    months : [({ month : Nat; due : Bool; paid : Bool })];
  };

  public type BillingStateView = {
    year : Nat;
    month : Nat;
    status : ?MonthStatus;
  };

  let globalPackages = Map.empty<Nat, Package>();
  let subscribers = Map.empty<Nat, Subscriber>();
  let billingStates = Map.empty<Nat, YearlyBilling>();

  let activeSubscribers = Set.empty<Nat>();

  // Map phone numbers to subscriber IDs for quick lookup
  let phoneToSubscriberId = Map.empty<Text, Nat>();

  // Init with default packages
  var nextPackageId = 1;
  var nextSubscriberId = 1;

  let package1mb = {
    id = nextPackageId;
    name = "1MB";
    priceUsd = 5;
  };

  nextPackageId += 1;

  let package2mb = {
    id = nextPackageId;
    name = "2MB";
    priceUsd = 10;
  };

  nextPackageId += 1;

  globalPackages.add(package1mb.id, package1mb);
  globalPackages.add(package2mb.id, package2mb);

  // Packages - Public information (anyone can view)
  public query ({ caller }) func getAllPackages() : async [Package] {
    globalPackages.values().toArray();
  };

  public query ({ caller }) func getPackage(id : Nat) : async Package {
    switch (globalPackages.get(id)) {
      case (null) { Runtime.trap("Package not found") };
      case (?pkg) { pkg };
    };
  };

  // Admin-only: Create or update packages
  public shared ({ caller }) func createPackage(name : Text, priceUsd : Nat) : async Package {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create packages");
    };
    let id = nextPackageId;
    nextPackageId += 1;
    let pkg = {
      id;
      name;
      priceUsd;
    };
    globalPackages.add(id, pkg);
    pkg;
  };

  public shared ({ caller }) func updatePackage(id : Nat, name : Text, priceUsd : Nat) : async Package {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update packages");
    };
    switch (globalPackages.get(id)) {
      case (null) { Runtime.trap("Package not found") };
      case (?_) {
        let pkg = { id; name; priceUsd };
        globalPackages.add(id, pkg);
        pkg;
      };
    };
  };

  // Subscribers - Admin-only operations
  public query ({ caller }) func getAllActiveSubscribers() : async [Subscriber] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all subscribers");
    };

    let results = List.empty<Subscriber>();
    for (id in activeSubscribers.values()) {
      switch (subscribers.get(id)) {
        case (?subscriber) {
          results.add(subscriber);
        };
        case (null) {};
      };
    };
    results.toArray();
  };

  public query ({ caller }) func getSubscriber(phone : Text) : async Subscriber {
    // Users can only view their own subscriber record
    let callerProfile = userProfiles.get(caller);
    let isOwnRecord = switch (callerProfile) {
      case (?profile) { profile.phone == phone };
      case (null) { false };
    };

    if (not isOwnRecord and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own subscriber record");
    };

    switch (phoneToSubscriberId.get(phone)) {
      case (?id) {
        switch (subscribers.get(id)) {
          case (?subscriber) { subscriber };
          case (null) { Runtime.trap("Subscriber not found") };
        };
      };
      case (null) { Runtime.trap("Subscriber not found with phone: '" # phone # "'") };
    };
  };

  public shared ({ caller }) func createSubscriber(
    fullName : Text,
    phone : Text,
    packageId : Nat,
    subscriptionStartDate : Time.Time
  ) : async Subscriber {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create subscribers");
    };

    // Verify package exists
    switch (globalPackages.get(packageId)) {
      case (null) { Runtime.trap("Package not found") };
      case (?_) {};
    };

    let id = nextSubscriberId;
    nextSubscriberId += 1;
    let subscriber = {
      id;
      fullName;
      phone;
      packageId;
      active = true;
      subscriptionStartDate;
    };

    subscribers.add(id, subscriber);
    phoneToSubscriberId.add(phone, id);
    activeSubscribers.add(id);
    subscriber;
  };

  public shared ({ caller }) func updateSubscriber(
    phone : Text,
    fullName : Text,
    packageId : Nat,
    active : Bool
  ) : async Subscriber {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update subscribers");
    };

    switch (phoneToSubscriberId.get(phone)) {
      case (?id) {
        switch (subscribers.get(id)) {
          case (?oldSubscriber) {
            let subscriber = {
              id;
              fullName;
              phone;
              packageId;
              active;
              subscriptionStartDate = oldSubscriber.subscriptionStartDate;
            };
            subscribers.add(id, subscriber);
            if (active) {
              activeSubscribers.add(id);
            } else {
              activeSubscribers.remove(id);
            };
            subscriber;
          };
          case (null) { Runtime.trap("Subscriber not found") };
        };
      };
      case (null) { Runtime.trap("Subscriber not found with phone: '" # phone # "'") };
    };
  };

  // Billing - Users can view own billing, admins can view all
  public query ({ caller }) func getBillingState(phone : Text) : async [BillingEntryView] {
    // Users can only view their own billing
    let callerProfile = userProfiles.get(caller);
    let isOwnRecord = switch (callerProfile) {
      case (?profile) { profile.phone == phone };
      case (null) { false };
    };

    if (not isOwnRecord and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own billing information");
    };

    switch (phoneToSubscriberId.get(phone)) {
      case (?subscriberId) {
        switch (billingStates.get(subscriberId)) {
          case (null) { [] };
          case (?yearlyBilling) {
            // Convert to array of BillingEntryViews
            let billingEntryList = List.empty<BillingEntryView>();
            for ((year, monthlyBilling) in yearlyBilling.entries()) {
              // Convert Map to array of {month, due, paid} values
              let monthsList = List.empty<{
                month : Nat;
                due : Bool;
                paid : Bool;
              }>();

              for ((month, status) in monthlyBilling.entries()) {
                monthsList.add({ month; due = status.due; paid = status.paid });
              };

              billingEntryList.add({ year; months = monthsList.toArray() });
            };
            billingEntryList.toArray();
          };
        };
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func setMonthBillingStatus(
    phone : Text,
    year : Nat,
    month : Nat,
    due : Bool,
    paid : Bool
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set billing status");
    };

    switch (phoneToSubscriberId.get(phone)) {
      case (?subscriberId) {
        let yearlyBilling = switch (billingStates.get(subscriberId)) {
          case (?yb) { yb };
          case (null) {
            let newYb = Map.empty<Nat, MonthlyBilling>();
            billingStates.add(subscriberId, newYb);
            newYb;
          };
        };

        let monthlyBilling = switch (yearlyBilling.get(year)) {
          case (?mb) { mb };
          case (null) {
            let newMb = Map.empty<Nat, MonthStatus>();
            yearlyBilling.add(year, newMb);
            newMb;
          };
        };

        monthlyBilling.add(month, { due; paid });
      };
      case (null) { Runtime.trap("Subscriber not found with phone: '" # phone # "'") };
    };
  };

  // Financial Reports - Admin only
  public query ({ caller }) func getTotalDueForMonth(year : Nat, month : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view financial reports");
    };

    var total : Nat = 0;
    for ((id, subscriber) in subscribers.entries()) {
      if (subscriber.active) {
        switch (billingStates.get(id)) {
          case (?yearlyBilling) {
            switch (yearlyBilling.get(year)) {
              case (?monthlyBilling) {
                switch (monthlyBilling.get(month)) {
                  case (?status) {
                    if (status.due and not status.paid) {
                      total += switch (globalPackages.get(subscriber.packageId)) {
                        case (?pkg) { pkg.priceUsd };
                        case (null) { 0 };
                      };
                    };
                  };
                  case (null) {};
                };
              };
              case (null) {};
            };
          };
          case (null) {};
        };
      };
    };
    total;
  };

  public query ({ caller }) func getTotalDueForYear(year : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view financial reports");
    };

    var total : Nat = 0;
    for ((id, subscriber) in subscribers.entries()) {
      if (subscriber.active) {
        switch (billingStates.get(id)) {
          case (?yearlyBilling) {
            switch (yearlyBilling.get(year)) {
              case (?monthlyBilling) {
                for ((month, status) in monthlyBilling.entries()) {
                  if (status.due and not status.paid) {
                    total += switch (globalPackages.get(subscriber.packageId)) {
                      case (?pkg) { pkg.priceUsd };
                      case (null) { 0 };
                    };
                  };
                };
              };
              case (null) {};
            };
          };
          case (null) {};
        };
      };
    };
    total;
  };

  public query ({ caller }) func getSubscriberBillingSummary(phone : Text) : async {
    totalDue : Nat;
    totalPaid : Nat;
    totalOutstanding : Nat;
  } {
    // Users can only view their own billing summary
    let callerProfile = userProfiles.get(caller);
    let isOwnRecord = switch (callerProfile) {
      case (?profile) { profile.phone == phone };
      case (null) { false };
    };

    if (not isOwnRecord and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own billing summary");
    };

    switch (phoneToSubscriberId.get(phone)) {
      case (?subscriberId) {
        switch (subscribers.get(subscriberId)) {
          case (?subscriber) {
            let packagePrice = switch (globalPackages.get(subscriber.packageId)) {
              case (?pkg) { pkg.priceUsd };
              case (null) { 0 };
            };

            var totalDue = 0;
            var totalPaid = 0;

            switch (billingStates.get(subscriber.id)) {
              case (?yearlyBilling) {
                for ((year, monthlyBilling) in yearlyBilling.entries()) {
                  for ((month, status) in monthlyBilling.entries()) {
                    if (status.due) {
                      totalDue += packagePrice;
                      if (status.paid) {
                        totalPaid += packagePrice;
                      };
                    };
                  };
                };
              };
              case (null) {};
            };

            let totalOutstanding = if (totalDue >= totalPaid) {
              totalDue - totalPaid;
            } else {
              0;
            };
            { totalDue; totalPaid; totalOutstanding };
          };
          case (null) { { totalDue = 0; totalPaid = 0; totalOutstanding = 0 } };
        };
      };
      case (null) { { totalDue = 0; totalPaid = 0; totalOutstanding = 0 } };
    };
  };
};
