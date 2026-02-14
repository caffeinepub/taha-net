import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Migration "migration";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
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

  public query ({ caller }) func isPhoneNumberTaken(phone : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check phone numbers");
    };
    phoneToSubscriberId.containsKey(phone);
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

  // Subscriber data structures
  let subscribers = Map.empty<Nat, Subscriber>();
  let activeSubscribers = Set.empty<Nat>();
  let phoneToSubscriberId = Map.empty<Text, Nat>();
  let billingStates = Map.empty<Nat, YearlyBilling>();

  let globalPackages = Map.empty<Nat, Package>();

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

  public type BulkImportInput = {
    names : Text;
    packageId : Nat;
    subscriptionStartDate : Time.Time;
  };

  public shared ({ caller }) func bulkCreateSubscribers(
    input : BulkImportInput
  ) : async [BulkImportResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create subscribers");
    };

    let lines = input.names.split(#char('\n'));
    let results = List.empty<BulkImportResult>();

    for (name in lines) {
      let trimmed = name.trim(#char(' '));
      if (trimmed.size() > 0) {
        // Check if the name is valid (non-empty)
        if (trimmed.size() <= 0) {
          results.add({
            name = trimmed;
            result = null;
            error = ?"Invalid Name: Full name cannot be empty";
          });
        } else {
          let placeholderPhone = "placeholder-" # nextSubscriberId.toText();
          let subscriber = {
            id = nextSubscriberId;
            fullName = trimmed;
            phone = placeholderPhone;
            packageId = input.packageId;
            active = true;
            subscriptionStartDate = input.subscriptionStartDate;
          };

          subscribers.add(nextSubscriberId, subscriber);
          activeSubscribers.add(nextSubscriberId);
          phoneToSubscriberId.add(placeholderPhone, nextSubscriberId);

          results.add({
            name = trimmed;
            result = ?subscriber;
            error = null;
          });
          nextSubscriberId += 1;
        };
      };
    };
    results.toArray();
  };

  public type BulkImportResult = {
    result : ?Subscriber;
    name : Text;
    error : ?Text;
  };

  // Admin-only: Delete all subscribers and related state
  public type DeleteAllSubscribersResult = {
    subscribersDeleted : Nat;
  };

  public shared ({ caller }) func deleteAllSubscribers() : async DeleteAllSubscribersResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete all subscribers");
    };

    // Count subscribers before deletion
    let count = subscribers.size();

    // Clear all subscriber-related data structures
    subscribers.clear();
    activeSubscribers.clear();
    phoneToSubscriberId.clear();
    billingStates.clear();

    {
      subscribersDeleted = count;
    };
  };

  public type SubscriberMonthlyBill = {
    fullName : Text;
    amountDue : Nat; // USD cents
  };

  public type MonthlyBillsResult = {
    year : Nat;
    month : Nat;
    subscribers : [SubscriberMonthlyBill];
  };

  // Admin-only: Fetch monthly bills for subscribers by year and month
  public query ({ caller }) func fetchMonthlyBills(year : Nat, month : Nat) : async MonthlyBillsResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch monthly bills");
    };

    let bills = List.empty<SubscriberMonthlyBill>();

    switch (billingStates) {
      case (states) {
        if (states.size() == 0) {
          Runtime.trap("No booked subscriptions found");
        };

        switch (states.get(year)) {
          case (null) { Runtime.trap("No bookings found for year: " # year.toText()) };
          case (?yearlyBilling) {
            switch (yearlyBilling.get(month)) {
              case (null) { Runtime.trap("No bookings found for year " # year.toText() # " month: " # month.toText()) };
              case (?_) {
                for ((id, subscriber) in subscribers.entries()) {
                  // Ensure the subscriber is active
                  if (subscriber.active) {
                    switch (globalPackages.get(subscriber.packageId)) {
                      case (null) { Runtime.trap("Subscriber package not found") };
                      case (?package) {
                        bills.add({
                          fullName = subscriber.fullName;
                          amountDue = package.priceUsd;
                        });
                      };
                    };
                  };
                };
                {
                  year;
                  month;
                  subscribers = bills.toArray();
                };
              };
            };
          };
        };
      };
    };
  };

  public type CallerPaymentDue = {
    year : Nat;
    month : Nat;
    amountCents : Nat;
  };

  public query ({ caller }) func getCallerMonthlyDue(year : Nat, month : Nat) : async CallerPaymentDue {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get due");
    };

    let userProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Caller does not have a user profile") };
      case (?profile) { profile };
    };

    let phone = userProfile.phone;
    let subscriberId = switch (phoneToSubscriberId.get(phone)) {
      case (?id) { id };
      case (null) { Runtime.trap("Caller does not have an active subscription") };
    };

    let subscriber = switch (subscribers.get(subscriberId)) {
      case (?sub) { sub };
      case (null) { Runtime.trap("No subscriber found for id: " # subscriberId.toText()) };
    };

    if (not subscriber.active) {
      Runtime.trap("Subscription with this phone number is not booked");
    };

    let pkg = switch (globalPackages.get(subscriber.packageId)) {
      case (null) { Runtime.trap("Subscription package not found") };
      case (?p) { p };
    };

    {
      year;
      month;
      amountCents = pkg.priceUsd;
    };
  };

  // Admin-only: Create a single subscriber
  public shared ({ caller }) func createSubscriber(
    fullName : Text,
    phone : Text,
    packageId : Nat,
    subscriptionStartDate : Time.Time,
  ) : async SubscriberResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create subscribers");
    };

    let trimmedName = fullName.trim(#char(' '));

    // Check if the name is valid (non-empty)
    if (trimmedName.size() <= 0) {
      return {
        result = null;
        error = ?"Invalid Name: Full name cannot be empty";
      };
    };

    // Check for duplicate phone number
    switch (phoneToSubscriberId.get(phone)) {
      case (?_) {
        return {
          result = null;
          error = ?"Duplicate: Phone number already exists";
        };
      };
      case (null) {};
    };

    let subscriber = {
      id = nextSubscriberId;
      fullName = trimmedName;
      phone;
      packageId;
      active = true;
      subscriptionStartDate;
    };

    subscribers.add(nextSubscriberId, subscriber);
    activeSubscribers.add(nextSubscriberId);
    phoneToSubscriberId.add(phone, nextSubscriberId);

    nextSubscriberId += 1;

    {
      result = ?subscriber;
      error = null;
    };
  };

  public type SubscriberResult = {
    result : ?Subscriber;
    error : ?Text;
  };

  // Lock/Claim subscriber to caller
  public type SubscriberLoginResult = {
    result : ?Subscriber;
    error : ?Text;
    claimedPhone : ?Text;
  };

  public type SubscriberLoginInput = {
    name : Text;
    phone : Text;
    subscriberId : ?Nat;
  };

  public shared ({ caller }) func loginClaimSubscriber(loginInput : SubscriberLoginInput) : async SubscriberLoginResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim subscriber");
    };

    switch (phoneToSubscriberId.get(loginInput.phone)) {
      case (?_) {
        return {
          result = null;
          error = ?"Duplicate: Phone number already exists";
          claimedPhone = ?loginInput.phone;
        };
      };
      case (null) {};
    };

    let subscriber =
      switch (loginInput.subscriberId, loginInput.name) {
        case (?id, _) {
          switch (subscribers.get(id)) {
            case (?subscriber) {
              subscriber;
            };
            case (null) {
              return {
                result = null;
                error = ?("Subscriber not found for id: " # id.toText());
                claimedPhone = null;
              };
            };
          };
        };
        case (null, name) {
          let matchingSubscribers = List.empty<Subscriber>();
          let searchText = name.trim(#char(' '));
          if (searchText == "") {
            return {
              result = null;
              error = ?("Name must not be empty");
              claimedPhone = null;
            };
          };
          for ((id, subscriber) in subscribers.entries()) {
            let subscriberText = subscriber.fullName.trim(#char(' '));
            if (
              subscriber.active and
              (subscriberText.size() > 0) and
              subscriberText.contains(#text(searchText))
            ) {
              matchingSubscribers.add(subscriber);
            };
          };
          let matches = matchingSubscribers.toArray();
          if (matches.size() == 1) { (matches[0]) } else if (matches.size() > 1) {
            return {
              result = null;
              error = ?("Found " # matches.size().toText() # " matches");
              claimedPhone = null;
            };
          } else {
            return {
              result = null;
              error = ?("No subscriber match found for " # searchText);
              claimedPhone = null;
            };
          };
        };
      };

    if (not subscriber.active) {
      return {
        result = null;
        error = ?("Only booked (active) subscribers can be claimed");
        claimedPhone = null;
      };
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (
          profile.phone != "" and profile.phone != subscriber.phone
        ) {
          return {
            result = null;
            error = (
              ?("You already claimed a different number (" # profile.phone # "): " # subscriber.fullName)
            );
            claimedPhone = ?subscriber.phone;
          };
        };
      };
      case (null) {};
    };

    // Lock phone to caller
    let newProfile = {
      name = subscriber.fullName;
      phone = loginInput.phone;
    };

    userProfiles.add(caller, newProfile);

    let newSubscriber = {
      subscriber with fullName = subscriber.fullName;
      active = subscriber.active;
      phone = loginInput.phone;
    };

    subscribers.add(newSubscriber.id, newSubscriber);

    phoneToSubscriberId.add(loginInput.phone, newSubscriber.id);

    {
      result = ?newSubscriber;
      error = null;
      claimedPhone = ?loginInput.phone;
    };
  };
};
