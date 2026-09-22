module.exports = (sequelize, type) => {

  return sequelize.define(

    'auction_state',

    {

      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      current_player_id: {
        type: type.INTEGER,
        allowNull: true
      },

      current_bid: {
        type: type.INTEGER,
        allowNull: true,
        defaultValue: 0
      },

      current_team_id: {
        type: type.INTEGER,
        allowNull: true
      },

      ends_at: {
        type: type.DATE,
        allowNull: true
      },

      status: {
        type: type.ENUM(
          'IDLE',
          'BIDDING',
          'PAUSED',
          'SOLD',
          'UNSOLD'
        ),
        allowNull: false,
        defaultValue: 'IDLE'
      }

    },

    {

      timestamps: true,

      freezeTableName: true,

      createdAt: 'createdAt',

      updatedAt: 'updatedAt',

      deletedAt: 'deletedAt',

      paranoid: true

    }

  )

}